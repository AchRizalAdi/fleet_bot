function normalizeSender(senderJid) {
  if (!senderJid) return '';
  return senderJid.replace(/@.+$/, '');
}

module.exports = { normalizeSender };
