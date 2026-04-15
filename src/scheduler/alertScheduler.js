const cron = require('node-cron');
const { formatAlertSummary } = require('../utils/formatter');

function createAlertScheduler({ logger, cronExpression, fleetService, sendText, alertTarget }) {
  let task;

  return {
    start() {
      task = cron.schedule(cronExpression, async () => {
        try {
          const alerts = await fleetService.getTodayAlerts();
          if (!alerts.length) {
            logger.info('No alerts to send');
            return;
          }
          await sendText(alertTarget, formatAlertSummary(alerts));
          logger.info({ total: alerts.length, alertTarget }, 'Alert sent');
        } catch (error) {
          logger.error({ err: error }, 'Failed running alert scheduler');
        }
      });
      logger.info({ cronExpression }, 'Alert scheduler started');
      return task;
    },
  };
}

module.exports = { createAlertScheduler };
