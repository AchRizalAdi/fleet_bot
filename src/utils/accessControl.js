function isGroup(jid) {
  return jid.endsWith("@g.us");
}

function isUser(jid) {
  return jid.endsWith("@s.whatsapp.net") || jid.endsWith("@lid");
}

function isAllowed({ sender, replyTo, env }) {
  const senderNormalized = sender.toLowerCase();
  const chatNormalized = (replyTo || sender).toLowerCase();

  // ===== GROUP =====
  if (isGroup(chatNormalized)) {
    if (!env.ALLOW_GROUP) return false;

    if (env.ALLOWED_GROUPS.length === 0) return true;

    return env.ALLOWED_GROUPS.includes(chatNormalized);
  }

  // ===== PERSONAL =====
  if (isUser(senderNormalized)) {
    if (!env.ALLOW_PERSONAL) return false;

    if (env.ALLOWED_USERS.length === 0) return true;

    return env.ALLOWED_USERS.includes(senderNormalized);
  }

  return false;
}

module.exports = { isAllowed };