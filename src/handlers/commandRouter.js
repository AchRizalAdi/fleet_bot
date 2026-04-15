const { normalizeMessage } = require('../utils/normalizeMessage');
const {
  formatHelp,
  formatDocumentStatus,
  formatTireStock,
  formatAlertSummary,
} = require('../utils/formatter');

function normalizeJid(value = '') {
  return String(value).trim().toLowerCase();
}

function createCommandRouter({ fleetService, logger, env }) {
  async function handleIncoming({ sender, text }) {
    const normalizedSender = normalizeJid(sender);
    const allowedSenders = (env.ALLOWED_SENDERS || []).map(normalizeJid);

    const message = normalizeMessage(text);
    const upper = message.toUpperCase();

    if (allowedSenders.length > 0 && !allowedSenders.includes(normalizedSender)) {
      logger.warn({ sender: normalizedSender, allowedSenders }, 'Unauthorized sender');
      return 'Unauthorized';
    }

    if (!message) return null;
    if (upper === 'HELP') return formatHelp();

    let match = upper.match(/^CEK SURAT\s+([A-Z0-9-]+)$/);
    if (match) {
      const result = await fleetService.getVehicleDocuments(match[1]);
      return formatDocumentStatus(result);
    }

    match = upper.match(/^UPDATE SURAT\s+([A-Z0-9-]+)\s+([A-Z]+)\s+(\d{4}-\d{2}-\d{2})$/);
    if (match) {
      const [, plate, type, expiryDate] = match;
      await fleetService.updateVehicleDocument({ plate, type, expiryDate, actor: normalizedSender });
      return `UPDATE SURAT berhasil\nPlat: ${plate}\nJenis: ${type}\nExpired: ${expiryDate}`;
    }

    match = upper.match(/^CEK STOCK BAN\s+(.+)$/);
    if (match) {
      const stock = await fleetService.getTireStock(match[1].trim());
      return formatTireStock(stock);
    }

    match = upper.match(/^UPDATE BAN\s+([A-Z0-9-]+)\s+([A-Z_]+)\s+(\d+)$/);
    if (match) {
      const [, plate, position, km] = match;
      await fleetService.updateTireUsage({ plate, position, km: Number(km), actor: normalizedSender });
      return `UPDATE BAN berhasil\nPlat: ${plate}\nPosisi: ${position}\nKM: ${km}`;
    }

    if (upper === 'ALERT HARI INI') {
      const alerts = await fleetService.getTodayAlerts();
      return formatAlertSummary(alerts);
    }

    return 'Command tidak dikenali. Ketik HELP.';
  }

  return { handleIncoming };
}

module.exports = { createCommandRouter };