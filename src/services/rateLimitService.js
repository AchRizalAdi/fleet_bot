function buildRateLimitKey(key) {
  const normalized = String(key || "").trim().toLowerCase();
  return `wa:ratelimit:${normalized}`;
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function createRateLimitService({ redis, logger }) {
  return {
    async checkLimit({ key, limit, windowSeconds }) {
      const safeLimit = toPositiveInt(limit, 5);
      const safeWindowSeconds = toPositiveInt(windowSeconds, 10);
      const redisKey = buildRateLimitKey(key);

      try {
        const counter = await redis.incr(redisKey);

        if (counter === 1) {
          await redis.expire(redisKey, safeWindowSeconds);
        }

        const ttl = await redis.ttl(redisKey);
        const resetInSeconds = ttl > 0 ? ttl : safeWindowSeconds;
        const allowed = counter <= safeLimit;

        return {
          allowed,
          remaining: allowed ? Math.max(safeLimit - counter, 0) : 0,
          resetInSeconds,
        };
      } catch (err) {
        logger.error({ err }, "Rate limit check failed");
        return {
          allowed: true,
          remaining: safeLimit,
          resetInSeconds: 0,
        };
      }
    },
  };
}

module.exports = { createRateLimitService };
