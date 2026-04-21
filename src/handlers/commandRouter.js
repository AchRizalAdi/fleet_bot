const fs = require("fs");
const path = require("path");
const { normalizeMessage } = require("../utils/normalizeMessage");
const { normalizeSender } = require("../utils/sender");
const {
  formatDefaultReply,
  formatDefaultReplyShortVer,
  formatUserActivatedMessage,
  formatRegistrationPending,
  formatAccountDisabled,
  formatNoAccess,
  formatGenericSystemError,
} = require("../utils/formatter");
// const { canExecute } = require("../config/permissions");

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

function createCommandRouter({ fleetService, userRepository, auditRepository, authCacheService, logger, sendText, sendImage }) {
  const services = { fleetService, authCacheService };
  const repositories = { userRepository, auditRepository };
  const utils = {
    formatDefaultReply,
    formatDefaultReplyShortVer,
    formatUserActivatedMessage,
    formatRegistrationPending,
    formatAccountDisabled,
    formatNoAccess,
    formatGenericSystemError,
  };

  async function handleIncoming({ sender, replyTo, text }) {
    const normalizedSender = normalizeJid(sender);
    const message = normalizeMessage(text);
    const upper = message.toUpperCase();

    logger.info({ sender: normalizedSender, replyTo, text: message }, "Incoming WhatsApp message");

    if (!message) return null;

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

    for (const command of commandModules) {
      const match = upper.match(command.pattern);
      if (!match) continue;

      logger.info({ sender: normalizedSender, command: command.name }, "Command matched");

      if (user.role !== 'SUPERADMIN' && command.permission && !user.permissions.includes(command.permission)) {
        return formatNoAccess();
      }

      try {
        const result = await command.execute({
          match,
          user,
          sender: normalizedSender,
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
      await sendImage(replyTo, logoPath, formatDefaultReplyShortVer({ user }));
      return null;
    }

    return formatDefaultReplyShortVer({ user });
  }

  return { handleIncoming };
}

module.exports = { createCommandRouter };
