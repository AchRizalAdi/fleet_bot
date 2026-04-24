function mapWhatsappCheck(waStatus) {
  if (!waStatus) return "disconnected";
  if (waStatus.connected) return "connected";
  if (waStatus.connecting) return "connecting";
  return "disconnected";
}

function registerHealthRoutes(app, { logger, healthService, healthProviders } = {}) {
  app.get('/health', async (_request, reply) => {
    const baseHealth = healthService
      ? await healthService.getHealth()
      : {
          status: 'degraded',
          coreHealthy: false,
          service: 'fleet-wa-bot',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          checks: {
            redis: 'disconnected',
            backend: 'disconnected',
            whatsapp: 'disconnected',
          },
          details: {
            whatsapp: {
              connected: false,
              connecting: false,
              lastConnectedAt: null,
              lastDisconnectedAt: null,
              lastDisconnectReason: 'unavailable',
              reconnectAttempts: 0,
            },
          },
        };

    const waStatus = healthProviders && typeof healthProviders.whatsapp === 'function'
      ? healthProviders.whatsapp()
      : (baseHealth.details && baseHealth.details.whatsapp) || null;

    const whatsappCheck = mapWhatsappCheck(waStatus);

    const health = {
      ...baseHealth,
      checks: {
        ...(baseHealth.checks || {}),
        whatsapp: whatsappCheck,
      },
      details: {
        ...(baseHealth.details || {}),
        whatsapp: waStatus || {
          connected: false,
          connecting: false,
          lastConnectedAt: null,
          lastDisconnectedAt: null,
          lastDisconnectReason: 'unavailable',
          reconnectAttempts: 0,
        },
      },
    };

    if (whatsappCheck !== 'connected') {
      health.status = 'degraded';
      if (logger) {
        logger.warn({ whatsapp: health.details.whatsapp }, 'WhatsApp health degraded');
      }
    }

    // Keep HTTP 200 when only WhatsApp is degraded; 503 is reserved for core dependency failures.
    const shouldReturn503 = health.coreHealthy === false;
    reply.code(shouldReturn503 ? 503 : 200);
    return health;
  });
}

module.exports = { registerHealthRoutes };
