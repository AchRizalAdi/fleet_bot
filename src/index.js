require('dotenv').config();
const { createApp } = require('./app/createApp');

(async () => {
  const app = await createApp();
  await app.start();
})();
