function isGroup(jid) {
  return jid.endsWith("@g.us");
}

function isUser(jid) {
  return jid.endsWith("@s.whatsapp.net") || jid.endsWith("@lid");
}

function isAllowed({ sender, replyTo, env }) {
  const senderNormalized = String(sender || "").toLowerCase();
  const chatNormalized = String(replyTo || sender || "").toLowerCase();

  // ===== GROUP =====
  if (isGroup(chatNormalized)) {
    if (env.ALLOWED_GROUPS.length > 0) {
      if (env.ALLOWED_GROUPS.includes(chatNormalized)) {
        return true;
      }
      return false;
    }

    return env.ALLOW_GROUP === true;
  }

  // ===== PERSONAL =====
  if (isUser(senderNormalized)) {
    if (env.ALLOWED_USERS.length > 0) {
      if (env.ALLOWED_USERS.includes(senderNormalized)) {
        return true;
      }
      return false;
    }

    return env.ALLOW_PERSONAL === true;
  }

  return false;
}

module.exports = { isAllowed };