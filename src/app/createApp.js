const { buildHttpServer } = require('./httpServer');
const { createLogger } = require('../config/logger');
const { env } = require('../config/env');
const { createCommandRouter } = require('../handlers/commandRouter');
const { createFleetRepository } = require('../repositories/fleetRepository');
const { createFleetService } = require('../services/fleetService');
const { createAlertScheduler } = require('../scheduler/alertScheduler');
const { createBaileysAdapter } = require('../adapters/whatsapp/baileysAdapter');
const userRepository = require('../repositories/userRepository');

async function createApp() {
  const logger = createLogger();
  const repository = createFleetRepository();
  const fleetService = createFleetService({ repository, logger });

  const commandRouter = createCommandRouter({
    fleetService,
    userRepository,
    logger,
    env,
  });

  const httpServer = buildHttpServer({ logger });

  const whatsapp = createBaileysAdapter({
    logger,
    commandRouter,
    enabled: env.WA_ENABLED,
    authDir: env.WA_AUTH_DIR,
  });

  const alertScheduler = createAlertScheduler({
    logger,
    cronExpression: env.ALERT_CRON,
    fleetService,
    sendText: async (to, text) => {
      if (!to) return;
      await whatsapp.sendText(to, text);
    },
    alertTarget: env.ALERT_TARGET,
  });

  return {
    async start() {
      await httpServer.listen({ port: env.APP_PORT, host: env.APP_HOST });
      logger.info(`HTTP server listening on ${env.APP_HOST}:${env.APP_PORT}`);

      await whatsapp.start();
      alertScheduler.start();
      logger.info('Fleet WA Bot started');
    },
  };
}

module.exports = { createApp };