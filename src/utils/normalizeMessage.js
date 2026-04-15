function normalizeMessage(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { normalizeMessage };
