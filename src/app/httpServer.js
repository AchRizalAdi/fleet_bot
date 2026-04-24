const Fastify = require('fastify');
const { registerHealthRoutes } = require('../routes/healthRoutes');

function buildHttpServer({ logger, healthService, healthProviders }) {
  const app = Fastify({ logger: false });

  registerHealthRoutes(app, { logger, healthService, healthProviders });

  return app;
}

module.exports = { buildHttpServer };
