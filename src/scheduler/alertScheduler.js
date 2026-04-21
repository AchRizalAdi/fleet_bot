const cron = require('node-cron');

function formatAlertSummary(items) {
  if (!items || items.error) {
    return ["ALERT HARI INI", "", "Gagal mengambil data alert.", "Silakan coba lagi nanti."].join("\n");
  }

  if (!Array.isArray(items) || !items.length) {
    return ["ALERT HARI INI", "", "Tidak ada alert."].join("\n");
  }

  const limited = items.slice(0, 10);
  const lines = ["ALERT HARI INI", ""];

  limited.forEach((alert, idx) => {
    lines.push(`${idx + 1}. ${alert.nopol}`);
    lines.push(`Tipe: ${alert.title}`);
    if (alert.notification_created_at) {
      lines.push(`Waktu: ${alert.notification_created_at}`);
    }
    if (alert.customer_name) {
      lines.push(`Customer: ${alert.customer_name}`);
    }
    lines.push("");
  });

  return lines.join("\n").trim();
}

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
