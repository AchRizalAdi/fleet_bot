const { buildHttpServer } = require("./httpServer");
const { createLogger } = require("../config/logger");
const { env } = require("../config/env");
const { createCommandRouter } = require("../handlers/commandRouter");
const { createApiClient } = require("../lib/apiClient");
const { createFleetRepository } = require("../repositories/fleetRepository");
const { createUserRepository } = require("../repositories/userRepository");
const { createAuditRepository } = require("../repositories/auditRepository");
const { createFleetService } = require("../services/fleetService");
const { createAlertScheduler } = require("../scheduler/alertScheduler");
const { createBaileysAdapter } = require("../adapters/whatsapp/baileysAdapter");
const { getRedisClient } = require("../lib/redisClient");
const { createAuthCacheService } = require("../services/authCacheService");
const { createSessionService } = require("../services/sessionService");

function createHealthService({ redis, apiClient, backendHealthPath }) {
  return {
    async getHealth() {
      const [redisConnected, backendConnected] = await Promise.all([
        redis
          .ping()
          .then(() => true)
          .catch(() => false),
        apiClient
          .healthCheck(backendHealthPath)
          .then((ok) => ok)
          .catch(() => false),
      ]);

      const checks = {
        redis: redisConnected ? "connected" : "disconnected",
        backend: backendConnected ? "connected" : "disconnected",
      };

      return {
        status: redisConnected && backendConnected ? "ok" : "degraded",
        service: "fleet-wa-bot",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        checks,
      };
    },
  };
}

async function createApp() {
  const logger = createLogger();

  const redis = await getRedisClient(logger);
  const authCacheService = createAuthCacheService({ redis, logger });
  const sessionService = createSessionService({ redis, logger });

  // Initialize API Client
  const apiClient = createApiClient({ env, logger });

  const healthService = createHealthService({
    redis,
    apiClient,
    backendHealthPath: env.BACKEND_HEALTH_PATH,
  });

  // Initialize Repositories
  const fleetRepository = createFleetRepository({ apiClient, logger });
  const userRepository = createUserRepository({ apiClient, logger });
  const auditRepository = createAuditRepository({ apiClient, logger });

  // Initialize Services
  const fleetService = createFleetService({ repository: fleetRepository, logger });

  let whatsapp;

  const sendText = async (to, text) => {
    if (!to || !text) return;
    if (!whatsapp) {
      logger.warn({ to }, "WhatsApp adapter not ready, skip sendText");
      return;
    }
    await whatsapp.sendText(to, text);
  };

  const sendImage = async (to, imagePath, caption) => {
    if (!to || !imagePath) return;
    if (!whatsapp) {
      logger.warn({ to, imagePath }, "WhatsApp adapter not ready, skip sendImage");
      return;
    }
    await whatsapp.sendImage(to, imagePath, caption);
  };

  const commandRouter = createCommandRouter({
    fleetService,
    sessionService,
    userRepository,
    auditRepository,
    authCacheService,
    logger,
    env,
    sendText,
    sendImage,
  });

  const httpServer = buildHttpServer({ healthService });

  whatsapp = createBaileysAdapter({
    logger,
    commandRouter,
    enabled: env.WA_ENABLED,
    authDir: env.WA_AUTH_DIR,
  });

  const alertScheduler = createAlertScheduler({
    logger,
    cronExpression: env.ALERT_CRON,
    fleetService,
    sendText,
    alertTarget: env.ALERT_TARGET,
  });

  return {
    async start() {
      await httpServer.listen({ port: env.APP_PORT, host: env.APP_HOST });
      logger.info(`HTTP server listening on ${env.APP_HOST}:${env.APP_PORT}`);

      await whatsapp.start();
      // alertScheduler.start();
      logger.info("Fleet WA Bot started");
    },
  };
}

module.exports = { createApp };
