const AUTH_TTL = 300;
const PENDING_TTL = 60;

function getAuthKey(jid) {
  return `wa:auth:${String(jid).trim().toLowerCase()}`;
}

function getPendingKey(jid) {
  return `wa:pending:${String(jid).trim().toLowerCase()}`;
}

function safeParse(raw, logger, key) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    logger?.error({ err, key }, "Failed to parse Redis value");
    return null;
  }
}

function createAuthCacheService({ redis, logger }) {
  return {
    async getAuth(jid) {
      try {
        const key = getAuthKey(jid);
        const raw = await redis.get(key);
        return raw ? safeParse(raw, logger, key) : null;
      } catch (err) {
        logger?.error({ err, jid }, "Redis getAuth failed");
        return null;
      }
    },

    async setAuth(jid, value, ttlSeconds = AUTH_TTL) {
      try {
        const key = getAuthKey(jid);
        await redis.setEx(key, ttlSeconds, JSON.stringify(value));
      } catch (err) {
        logger?.error({ err, jid }, "Redis setAuth failed");
      }
    },

    async deleteAuth(jid) {
      try {
        await redis.del(getAuthKey(jid));
      } catch (err) {
        logger?.error({ err, jid }, "Redis deleteAuth failed");
      }
    },

    async getPending(jid) {
      try {
        const key = getPendingKey(jid);
        const raw = await redis.get(key);
        return raw ? safeParse(raw, logger, key) : null;
      } catch (err) {
        logger?.error({ err, jid }, "Redis getPending failed");
        return null;
      }
    },

    async setPending(jid, value, ttlSeconds = PENDING_TTL) {
      try {
        const key = getPendingKey(jid);
        await redis.setEx(key, ttlSeconds, JSON.stringify(value));
      } catch (err) {
        logger?.error({ err, jid }, "Redis setPending failed");
      }
    },

    async deletePending(jid) {
      try {
        await redis.del(getPendingKey(jid));
      } catch (err) {
        logger?.error({ err, jid }, "Redis deletePending failed");
      }
    },

    async invalidateUser(jid) {
      try {
        await redis.del(getAuthKey(jid), getPendingKey(jid));
      } catch (err) {
        logger?.error({ err, jid }, "Redis invalidateUser failed");
      }
    },
  };
}

module.exports = {
  createAuthCacheService,
};