const { createClient } = require("redis");
const { env } = require("../config/env");

let client;

function getRedisUrl() {
  const host = env.REDIS_HOST || "127.0.0.1";
  const port = env.REDIS_PORT || 6379;
  const password = env.REDIS_PASSWORD || "";

  if (password) {
    return `redis://:${password}@${host}:${port}`;
  }

  return `redis://${host}:${port}`;
}

async function getRedisClient(logger) {
  if (client && client.isOpen) {
    return client;
  }

  client = createClient({
    url: getRedisUrl(),
    database: Number(env.REDIS_DB || 0),
  });

  client.on("error", (err) => {
    if (logger) {
      logger.error({ err }, "Redis client error");
    } else {
      console.error("Redis client error", err);
    }
  });

  await client.connect();

  if (logger) {
    logger.info("Redis connected");
  }

  return client;
}

module.exports = {
  getRedisClient,
};