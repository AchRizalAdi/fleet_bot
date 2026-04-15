const pino = require('pino');
const { env } = require('./env');

function createLogger() {
  return pino({ level: env.LOG_LEVEL });
}

module.exports = { createLogger };
