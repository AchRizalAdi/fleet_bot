const DEFAULT_SESSION_TTL_SECONDS = 300;

function resolveScope(replyTo = "") {
  const normalized = String(replyTo || "").trim().toLowerCase();
  return normalized.endsWith("@g.us") ? normalized : "personal";
}

function buildSessionKey({ sender, replyTo }) {
  const normalizedSender = String(sender || "").trim().toLowerCase();
  const scope = resolveScope(replyTo);
  return `wa:session:${scope}:${normalizedSender}`;
}

function createSessionService({ redis, logger }) {
  async function getSession({ sender, replyTo }) {
    const key = buildSessionKey({ sender, replyTo });
    const raw = await redis.get(key);

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      logger.warn({ key, error: error.message }, "Invalid session payload in Redis");
      await redis.del(key);
      return null;
    }
  }

  async function setSession({ sender, replyTo, value, ttlSeconds = DEFAULT_SESSION_TTL_SECONDS }) {
    const key = buildSessionKey({ sender, replyTo });
    await redis.set(key, JSON.stringify(value), { EX: Number(ttlSeconds) || DEFAULT_SESSION_TTL_SECONDS });
    return value;
  }

  async function updateSession({ sender, replyTo, patch, ttlSeconds = DEFAULT_SESSION_TTL_SECONDS }) {
    const current = (await getSession({ sender, replyTo })) || {};

    const next = {
      ...current,
      ...(patch || {}),
      data: {
        ...(current.data || {}),
        ...((patch && patch.data) || {}),
      },
    };

    await setSession({ sender, replyTo, value: next, ttlSeconds });
    return next;
  }

  async function clearSession({ sender, replyTo }) {
    const key = buildSessionKey({ sender, replyTo });
    await redis.del(key);
  }

  return {
    getSession,
    setSession,
    updateSession,
    clearSession,
    buildSessionKey,
  };
}

module.exports = {
  DEFAULT_SESSION_TTL_SECONDS,
  createSessionService,
};
