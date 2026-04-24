const fs = require("fs");
const path = require("path");
const { normalizeMessage } = require("../utils/normalizeMessage");
const { normalizeSender } = require("../utils/sender");
const {
  formatDefaultReply,
  formatUserActivatedMessage,
  formatRegistrationPending,
  formatAccountDisabled,
  formatNoAccess,
  formatGenericSystemError,
  formatRateLimitExceeded,
} = require("../utils/formatter");
const { createSessionHandler } = require("./sessionHandler");
const { isAllowed } = require("../utils/accessControl");
const { env } = require("../config/env");

const commandModules = [
  require("./commands/helpCommand"),
  require("./commands/listPendingUsersCommand"),
  require("./commands/approveUserCommand"),
  require("./commands/rejectUserCommand"),
  require("./commands/cekSuratCommand"),
  require("./commands/updateSuratCommand"),
  require("./commands/cekStockBanCommand"),
  require("./commands/updateBanCommand"),
  require("./commands/alertHariIniCommand"),
  require("./commands/logTerakhirCommand"),
];

function normalizeJid(value = "") {
  return String(normalizeSender(value)).trim().toLowerCase();
}

function createCommandRouter({ fleetService, sessionService, rateLimitService, userRepository, auditRepository, authCacheService, logger, sendText, sendImage }) {
  const services = { fleetService, authCacheService, sessionService };
  const repositories = { userRepository, auditRepository };
  const utils = {
    formatDefaultReply,
    formatUserActivatedMessage,
    formatRegistrationPending,
    formatAccountDisabled,
    formatNoAccess,
    formatGenericSystemError,
    formatRateLimitExceeded,
  };

  const sessionHandler = sessionService
    ? createSessionHandler({ sessionService, fleetService, auditRepository, logger })
    : null;

  async function handleIncoming({ sender, replyTo, text }) {
    const normalizedSender = normalizeJid(sender);
    const message = normalizeMessage(text);

    if (!message) return null;

    if (!isAllowed({ sender: normalizedSender, replyTo, env })) {
      logger.warn(
        {
          sender: normalizedSender,
          replyTo,
        },
        "Blocked message (not allowed)",
      );

      return null; // silent ignore
    }

    logger.info({ sender: normalizedSender, replyTo, text: message }, "Incoming WhatsApp message");

    const trigger = "CIMI";
    const upper = message.toUpperCase();
    const hasTrigger = upper.startsWith(trigger);

    if (!hasTrigger) {
      logger.info({ sender: normalizedSender, text: message }, "Message ignored: missing CIMI trigger");
      return null;
    }

    if (env.RATE_LIMIT_ENABLED && rateLimitService) {
      const rateLimit = await rateLimitService.checkLimit({
        key: normalizedSender,
        limit: env.RATE_LIMIT_MAX_REQUESTS,
        windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
      });

      if (!rateLimit.allowed) {
        logger.warn(
          {
            sender: normalizedSender,
            resetInSeconds: rateLimit.resetInSeconds,
          },
          "Rate limit exceeded",
        );
        return formatRateLimitExceeded();
      }

      logger.info(
        {
          sender: normalizedSender,
          remaining: rateLimit.remaining,
        },
        "Rate limit allowed",
      );
    }

    let user = await authCacheService.getAuth(normalizedSender);

    if (user) {
      logger.info({ sender: normalizedSender }, "Auth cache hit");
    } else {
      logger.info({ sender: normalizedSender }, "Auth cache miss");
    }

    if (!user) {
      user = await userRepository.findUserByJid(normalizedSender);

      if (user) {
        await authCacheService.setAuth(normalizedSender, user, 300);
      }
    }

    if (!user) {
      let pending = await authCacheService.getPending(normalizedSender);

      if (pending) {
        logger.info({ sender: normalizedSender }, "Pending cache hit");
      } else {
        logger.info({ sender: normalizedSender }, "Pending cache miss");
      }

      if (!pending) {
        pending = await userRepository.findPendingByJid(normalizedSender);

        if (!pending) {
          pending = await userRepository.createPendingUser({ jid: normalizedSender });
          logger.info({ sender: normalizedSender, code: pending.code }, "Pending user created");
        }

        if (pending) {
          await authCacheService.setPending(normalizedSender, pending, 60);
        }
      }

      return formatRegistrationPending({ code: pending.code });
    } else if (user.isActive === false) {
      return formatAccountDisabled();
    }

    const sessionText = normalizeMessage(message.slice(trigger.length).trim());

    if (sessionHandler) {
      const activeSession = await sessionService.getSession({ sender: normalizedSender, replyTo });

      if (activeSession) {
        logger.info({ sender: normalizedSender, flow: activeSession.flow, step: activeSession.step }, "Active session detected");

        return sessionHandler.continueFlow({
          sender: normalizedSender,
          replyTo,
          text: sessionText,
          user,
        });
      }
    }

    const commandText = message.slice(trigger.length).trim();
    const normalizedCommand = normalizeMessage(commandText);
    const upperCommand = normalizedCommand.toUpperCase();

    for (const command of commandModules) {
      const match = upperCommand.match(command.pattern);
      if (!match) continue;

      logger.info({ sender: normalizedSender, command: command.name }, "Command matched");

      if (user.role !== "SUPERADMIN" && command.permission && !user.permissions.includes(command.permission)) {
        return formatNoAccess();
      }

      try {
        const result = await command.execute({
          match,
          user,
          sender: normalizedSender,
          replyTo,
          authCacheService,
          services,
          repositories,
          utils,
          sendText,
          logger,
        });

        logger.info({ sender: normalizedSender, command: command.name }, "Command executed successfully");
        return result;
      } catch (err) {
        logger.error({ sender: normalizedSender, command: command.name, err }, "Command execution failed");
        throw err;
      }
    }

    const primaryLogoPath = path.join(process.cwd(), "assets", "logo-cakra.jpg");
    const fallbackLogoPath = path.join(process.cwd(), "src", "assets", "logo-cakra.jpg");
    const logoPath = fs.existsSync(primaryLogoPath) ? primaryLogoPath : fallbackLogoPath;

    if (sendImage && replyTo && fs.existsSync(logoPath)) {
      await sendImage(replyTo, logoPath, formatDefaultReply({ user }));
      return null;
    }

    return formatDefaultReply({ user });
  }

  return { handleIncoming };
}

module.exports = { createCommandRouter };
