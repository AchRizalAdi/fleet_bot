const Fastify = require('fastify');
const { registerHealthRoutes } = require('../routes/healthRoutes');

function buildHttpServer({ logger }) {
  const app = Fastify({ logger: false });

  registerHealthRoutes(app, { logger });

  return app;
}

module.exports = { buildHttpServer };
