function registerHealthRoutes(app, { healthService } = {}) {
  app.get('/health', async (_request, reply) => {
    const health = healthService
      ? await healthService.getHealth()
      : {
          status: 'degraded',
          service: 'fleet-wa-bot',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          checks: {
            redis: 'disconnected',
            backend: 'disconnected',
          },
        };

    reply.code(health.status === 'ok' ? 200 : 503);
    return health;
  });
}

module.exports = { registerHealthRoutes };
