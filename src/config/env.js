function getRequiredString(name, fallback) {
  return process.env[name] || fallback;
}

function getBoolean(name, fallback = false) {
  const raw = process.env[name];
  if (raw == null) return fallback;
  return ["1", "true", "yes", "on"].includes(String(raw).toLowerCase());
}

function getNumber(name, fallback) {
  const raw = process.env[name];
  return raw ? Number(raw) : fallback;
}

const env = {
  NODE_ENV: getRequiredString("NODE_ENV", "development"),
  APP_PORT: getNumber("APP_PORT", 3000),
  APP_HOST: getRequiredString("APP_HOST", "0.0.0.0"),
  LOG_LEVEL: getRequiredString("LOG_LEVEL", "info"),
  WA_AUTH_DIR: getRequiredString("WA_AUTH_DIR", ".wa-auth"),
  WA_ENABLED: getBoolean("WA_ENABLED", true),
  ALLOWED_SENDERS: (process.env.ALLOWED_SENDERS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
  ALERT_TARGET: getRequiredString("ALERT_TARGET", ""),
  ALERT_CRON: getRequiredString("ALERT_CRON", "0 8 * * *"),
  TMS_API_BASE_URL: getRequiredString("TMS_API_BASE_URL", "http://tms.cakraindo.com:7011"),
  TMS_API_KEY: getRequiredString("TMS_API_KEY", ""),
  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_DB: Number(process.env.REDIS_DB || 0),
};

module.exports = { env };
