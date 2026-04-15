function registerHealthRoutes(app) {
  app.get('/health', async () => {
    return {
      ok: true,
      service: 'fleet-wa-bot',
      timestamp: new Date().toISOString(),
    };
  });
}

module.exports = { registerHealthRoutes };
