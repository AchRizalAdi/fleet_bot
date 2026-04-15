const { normalizeMessage } = require("../utils/normalizeMessage");
const { normalizeSender } = require("../utils/sender");
const {
  formatHelp,
  formatDocumentStatus,
  formatTireStock,
  formatAlertSummary,
  formatDefaultReply,
  formatUserActivatedMessage,
} = require("../utils/formatter");
const { canExecute } = require("../config/permissions");

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

function createCommandRouter({ fleetService, userRepository, auditRepository, logger, sendText }) {
  const services = { fleetService };
  const repositories = { userRepository, auditRepository };
  const utils = {
    formatHelp,
    formatDocumentStatus,
    formatTireStock,
    formatAlertSummary,
    formatDefaultReply,
    formatUserActivatedMessage,
  };

  async function handleIncoming({ sender, text }) {
    const normalizedSender = normalizeJid(sender);
    const message = normalizeMessage(text);
    const upper = message.toUpperCase();

    if (!message) return null;

    let user = await userRepository.findUserByJid(normalizedSender);

    if (!user) {
      let pending = await userRepository.findPendingByJid(normalizedSender);
      if (!pending) {
        pending = await userRepository.createPendingUser({ jid: normalizedSender });
        logger.info({ sender: normalizedSender, code: pending.code }, "Pending user created");
      }

      return `Akun Anda belum terdaftar.\nKode registrasi: ${pending.code}\nHubungi admin untuk aktivasi.`;
    }

    for (const command of commandModules) {
      const match = upper.match(command.pattern);
      if (!match) continue;

      if (!canExecute(user.role, command.permission)) {
        return "Tidak punya akses.";
      }

      return command.execute({
        match,
        user,
        sender: normalizedSender,
        services,
        repositories,
        utils,
        sendText,
        logger,
      });
    }

    return formatDefaultReply({ user });
  }

  return { handleIncoming };
}

module.exports = { createCommandRouter };
