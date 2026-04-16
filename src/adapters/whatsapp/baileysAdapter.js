const pino = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const { Boom } = require("@hapi/boom");
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");

function createBaileysAdapter({ logger, commandRouter, enabled, authDir }) {
  let socket;
  let started = false;

  async function connect() {
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
        logger.info("QR generated, please scan");
      }

      if (connection === "open") {
        logger.info("WhatsApp connected");
      }

      if (connection === "close") {
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        logger.warn({ statusCode }, "WhatsApp connection closed");
        if (shouldReconnect) {
          setTimeout(() => connect().catch((err) => logger.error(err)), 3000);
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

        logger.info(
          {
            remoteJid: msg.key.remoteJid,
            participant: msg.key.participant,
            sender,
            replyTo,
            text,
          },
          "Incoming WhatsApp message",
        );

        const reply = await commandRouter.handleIncoming({ sender, replyTo, text });

        if (reply && replyTo) {
          await socket.sendMessage(replyTo, { text: reply });
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
      await connect();
    },

    async sendText(to, text) {
      if (!enabled) return;
      if (!socket) {
        logger.warn("Socket not ready, skip sendText");
        return;
      }
      if (!to || !text) return;
      await socket.sendMessage(to, { text });
    },

    async sendImage(to, imagePath, caption) {
      if (!enabled) return;
      if (!socket) {
        logger.warn("Socket not ready, skip sendImage");
        return;
      }
      if (!to || !imagePath) return;
      if (!fs.existsSync(imagePath)) {
        logger.warn({ imagePath }, "Image file not found, skip sendImage");
        return;
      }

      const imageBuffer = fs.readFileSync(imagePath);
      await socket.sendMessage(to, { image: imageBuffer, caption: caption || "" });
    },
  };
}

module.exports = { createBaileysAdapter };
