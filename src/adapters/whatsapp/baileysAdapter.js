const pino = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const { Boom } = require("@hapi/boom");
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");

function createBaileysAdapter({ logger, commandRouter, enabled, authDir }) {
  let socket;
  let started = false;
  let reconnectTimer = null;

  let isConnected = false;
  let isConnecting = false;
  let lastConnectedAt = null;
  let lastDisconnectedAt = null;
  let lastDisconnectReason = null;
  let reconnectAttempts = 0;

  const RECONNECT_BASE_DELAY_MS = 3000;
  const RECONNECT_MAX_DELAY_MS = 60000;
  const SEND_MIN_DELAY_MS = 500;
  const SEND_MAX_DELAY_MS = 1500;

  const sendQueue = [];
  let isProcessingQueue = false;

  function getStatus() {
    return {
      connected: isConnected,
      connecting: isConnecting,
      lastConnectedAt,
      lastDisconnectedAt,
      lastDisconnectReason,
      reconnectAttempts,
    };
  }

  function isSocketReady() {
    return Boolean(enabled && socket && isConnected);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getDisconnectReason(statusCode) {
    if (statusCode == null) return "unknown";

    const reasons = {
      [DisconnectReason.loggedOut]: "logged_out",
      [DisconnectReason.connectionClosed]: "connection_closed",
      [DisconnectReason.connectionLost]: "connection_lost",
      [DisconnectReason.connectionReplaced]: "connection_replaced",
      [DisconnectReason.timedOut]: "timed_out",
      [DisconnectReason.badSession]: "bad_session",
      [DisconnectReason.restartRequired]: "restart_required",
      [DisconnectReason.multideviceMismatch]: "multidevice_mismatch",
    };

    return reasons[statusCode] || `status_${statusCode}`;
  }

  function getBackoffDelay(attempt) {
    const exp = Math.max(0, Number(attempt) - 1);
    return Math.min(RECONNECT_BASE_DELAY_MS * (2 ** exp), RECONNECT_MAX_DELAY_MS);
  }

  function scheduleReconnect() {
    if (!enabled) return;

    reconnectAttempts += 1;
    const delayMs = getBackoffDelay(reconnectAttempts);

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect().catch((err) => {
        logger.error({ err }, "WhatsApp reconnect attempt failed");
        scheduleReconnect();
      });
    }, delayMs);

    logger.warn(
      {
        reconnectAttempts,
        delayMs,
      },
      "WhatsApp reconnect scheduled",
    );
  }

  async function processSendQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (sendQueue.length > 0) {
      const task = sendQueue.shift();
      if (!task) continue;

      try {
        const success = await task.execute();
        task.resolve(success);
      } catch (err) {
        logger.error({ err, type: task.type, to: task.to }, "Outbound send queue task failed");
        task.resolve(false);
      }

      const delayMs = getRandomDelay(SEND_MIN_DELAY_MS, SEND_MAX_DELAY_MS);
      await wait(delayMs);
    }

    isProcessingQueue = false;
  }

  function enqueueSend({ type, to, execute }) {
    return new Promise((resolve) => {
      sendQueue.push({ type, to, execute, resolve });
      processSendQueue().catch((err) => {
        logger.error({ err }, "Failed processing outbound send queue");
      });
    });
  }

  async function safeSendMessage({ type, to, payload }) {
    if (!enabled) {
      logger.warn({ type, to }, "WhatsApp adapter disabled, skipping outbound send");
      return false;
    }

    if (!isSocketReady()) {
      logger.warn({ type, to }, "Socket not ready, skipping outbound send");
      return false;
    }

    try {
      await socket.sendMessage(to, payload);
      logger.info({ type, to }, "Outbound send success");
      return true;
    } catch (err) {
      logger.error({ err, type, to }, "Outbound send failed");
      return false;
    }
  }

  async function connect() {
    if (!enabled) return;
    if (isConnecting) return;

    isConnecting = true;

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info({ version, isLatest }, "Using WhatsApp version");

    socket = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["FleetOps Bot", "Chrome", "1.0.0"],
    });

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        qrcode.generate(qr, { small: true });
        logger.info({ event: "qr_generated" }, "QR generated, please scan");
      }

      if (connection === "open") {
        isConnected = true;
        isConnecting = false;
        lastConnectedAt = new Date().toISOString();
        lastDisconnectReason = null;
        reconnectAttempts = 0;

        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }

        logger.info({ event: "connected", connectedAt: lastConnectedAt }, "WhatsApp connected");
      }

      if (connection === "close") {
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const reason = getDisconnectReason(statusCode);
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        isConnected = false;
        isConnecting = false;
        lastDisconnectedAt = new Date().toISOString();
        lastDisconnectReason = reason;

        logger.warn(
          {
            event: "disconnected",
            statusCode,
            reason,
            disconnectedAt: lastDisconnectedAt,
          },
          "WhatsApp connection closed",
        );

        if (shouldReconnect) {
          scheduleReconnect();
        } else {
          logger.warn({ event: "logged_out" }, "WhatsApp logged out, reconnect disabled");
        }
      }
    });

    socket.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const msg = messages[0];
        if (!msg || msg.key.fromMe || !msg.message) return;

        const sender = (msg.key.participant || msg.key.remoteJid || "").trim().toLowerCase();
        const replyTo = msg.key.remoteJid;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";

        const reply = await commandRouter.handleIncoming({ sender, replyTo, text });

        if (reply && replyTo) {
          await enqueueSend({
            type: "text",
            to: replyTo,
            execute: async () => safeSendMessage({ type: "text", to: replyTo, payload: { text: reply } }),
          });
        }
      } catch (error) {
        logger.error({ err: error }, "Failed handling incoming WhatsApp message");
      }
    });
  }

  return {
    async start() {
      if (!enabled) {
        logger.warn("WhatsApp adapter disabled");
        return;
      }
      if (started) return;
      started = true;
      await connect().catch((err) => {
        isConnecting = false;
        logger.error({ err }, "Initial WhatsApp connection failed");
        scheduleReconnect();
      });
    },

    async sendText(to, text) {
      if (!to || !text) return false;

      return enqueueSend({
        type: "text",
        to,
        execute: async () => safeSendMessage({ type: "text", to, payload: { text } }),
      });
    },

    async sendImage(to, imagePath, caption) {
      if (!to || !imagePath) return false;
      if (!fs.existsSync(imagePath)) {
        logger.warn({ imagePath }, "Image file not found, skip sendImage");
        return false;
      }

      return enqueueSend({
        type: "image",
        to,
        execute: async () => {
          try {
            const imageBuffer = fs.readFileSync(imagePath);
            return await safeSendMessage({
              type: "image",
              to,
              payload: { image: imageBuffer, caption: caption || "" },
            });
          } catch (err) {
            logger.error({ err, imagePath, to }, "Failed preparing image send payload");
            return false;
          }
        },
      });
    },

    getStatus,
  };
}

module.exports = { createBaileysAdapter };
