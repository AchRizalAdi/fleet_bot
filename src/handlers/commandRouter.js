const { normalizeMessage } = require("../utils/normalizeMessage");
const { formatHelp, formatDocumentStatus, formatTireStock, formatAlertSummary, formatDefaultReply, formatUserActivatedMessage } = require("../utils/formatter");
const { canExecute } = require("../config/permissions");

function normalizeJid(value = "") {
  return String(value).trim().toLowerCase();
}

function createCommandRouter({ fleetService, userRepository, logger, env, sendText }) {
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

    if (upper === "HELP") {
      if (!canExecute(user.role, "HELP")) return "Tidak punya akses.";
      return formatHelp(user.role);
    }

    if (upper === "LIST PENDING USER") {
      if (!canExecute(user.role, "LIST_PENDING_USER")) return "Tidak punya akses.";
      const pendingUsers = await userRepository.getPendingUsers();
      const activePending = pendingUsers.filter((item) => item.status === "pending");

      if (activePending.length === 0) {
        return "Tidak ada user pending.";
      }

      return ["PENDING USER:", ...activePending.map((item, index) => `${index + 1}. ${item.code} - ${item.jid}`)].join("\n");
    }

    let match = upper.match(/^APPROVE\s+([A-Z0-9-]+)\s+(VIEWER|OPERATOR|ADMIN)\s+(.+)$/);
    if (match) {
      if (!canExecute(user.role, "APPROVE_USER")) return "Tidak punya akses.";

      const [, code, role, name] = match;

      const result = await userRepository.approvePendingUser({
        code,
        role,
        name,
        approvedBy: normalizedSender,
      });

      if (!result) {
        return `Kode ${code} tidak ditemukan atau sudah diproses.`;
      }

      try {
        if (sendText && result.pending?.jid) {
          await sendText(result.pending.jid, formatUserActivatedMessage({ name, role }));
        }
      } catch (err) {
        logger.error({ err, jid: result.pending?.jid }, "Failed sending activation message");
      }

      return ["USER BERHASIL DIAKTIFKAN", "", `Nama: ${name}`, `Role: ${role}`].join("\n");
    }

    match = upper.match(/^REJECT\s+([A-Z0-9-]+)$/);
    if (match) {
      if (!canExecute(user.role, "REJECT_USER")) return "Tidak punya akses.";

      const [, code] = match;
      const result = await userRepository.rejectPendingUser({
        code,
        rejectedBy: normalizedSender,
      });

      if (!result) {
        return `Kode ${code} tidak ditemukan atau sudah diproses.`;
      }

      return `User berhasil di-reject.\nKode: ${code}`;
    }

    match = upper.match(/^CEK SURAT\s+([A-Z0-9-]+)$/);
    if (match) {
      if (!canExecute(user.role, "CEK_SURAT")) return "Tidak punya akses.";
      const result = await fleetService.getVehicleDocuments(match[1]);
      return formatDocumentStatus(result);
    }

    match = upper.match(/^UPDATE SURAT\s+([A-Z0-9-]+)\s+([A-Z]+)\s+(\d{4}-\d{2}-\d{2})$/);
    if (match) {
      if (!canExecute(user.role, "UPDATE_SURAT")) return "Tidak punya akses.";

      const [, plate, type, expiryDate] = match;
      await fleetService.updateVehicleDocument({
        plate,
        type,
        expiryDate,
        actor: normalizedSender,
      });

      return `UPDATE SURAT berhasil\nPlat: ${plate}\nJenis: ${type}\nExpired: ${expiryDate}`;
    }

    match = upper.match(/^CEK STOCK BAN\s+(.+)$/);
    if (match) {
      if (!canExecute(user.role, "CEK_STOCK_BAN")) return "Tidak punya akses.";
      const stock = await fleetService.getTireStock(match[1].trim());
      return formatTireStock(stock);
    }

    match = upper.match(/^UPDATE BAN\s+([A-Z0-9-]+)\s+([A-Z_]+)\s+(\d+)$/);
    if (match) {
      if (!canExecute(user.role, "UPDATE_BAN")) return "Tidak punya akses.";

      const [, plate, position, km] = match;
      await fleetService.updateTireUsage({
        plate,
        position,
        km: Number(km),
        actor: normalizedSender,
      });

      return `UPDATE BAN berhasil\nPlat: ${plate}\nPosisi: ${position}\nKM: ${km}`;
    }

    if (upper === "ALERT HARI INI") {
      if (!canExecute(user.role, "ALERT_HARI_INI")) return "Tidak punya akses.";
      const alerts = await fleetService.getTodayAlerts();
      return formatAlertSummary(alerts);
    }

    // return "Command tidak dikenali. Ketik HELP.";
    return formatDefaultReply({ user });
  }

  return { handleIncoming };
}

module.exports = { createCommandRouter };
