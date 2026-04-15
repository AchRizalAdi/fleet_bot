function getRequiredString(name, fallback) {
  return process.env[name] || fallback;
}

function getBoolean(name, fallback = false) {
  const raw = process.env[name];
  if (raw == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase());
}

function getNumber(name, fallback) {
  const raw = process.env[name];
  return raw ? Number(raw) : fallback;
}

const env = {
  NODE_ENV: getRequiredString('NODE_ENV', 'development'),
  APP_PORT: getNumber('APP_PORT', 3000),
  APP_HOST: getRequiredString('APP_HOST', '0.0.0.0'),
  LOG_LEVEL: getRequiredString('LOG_LEVEL', 'info'),
  WA_AUTH_DIR: getRequiredString('WA_AUTH_DIR', '.wa-auth'),
  WA_ENABLED: getBoolean('WA_ENABLED', true),
  ALLOWED_SENDERS: (process.env.ALLOWED_SENDERS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
  ALERT_TARGET: getRequiredString('ALERT_TARGET', ''),
  ALERT_CRON: getRequiredString('ALERT_CRON', '0 8 * * *'),
};

module.exports = { env };
