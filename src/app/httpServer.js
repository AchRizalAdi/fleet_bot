const Fastify = require('fastify');
const { registerHealthRoutes } = require('../routes/healthRoutes');

function buildHttpServer({ healthService }) {
  const app = Fastify({ logger: false });

  registerHealthRoutes(app, { healthService });

  return app;
}

module.exports = { buildHttpServer };
