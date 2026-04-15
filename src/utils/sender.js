function normalizeSender(senderJid) {
  if (!senderJid) return '';
  return String(senderJid).trim().toLowerCase();
}

module.exports = { normalizeSender };
