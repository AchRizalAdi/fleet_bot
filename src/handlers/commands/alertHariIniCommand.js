module.exports = {
  name: "ALERT_HARI_INI",
  permission: "ALERT_HARI_INI",
  pattern: /^ALERT HARI INI$/,
  async execute({ services, utils }) {
    const alerts = await services.fleetService.getTodayAlerts();
    return utils.formatAlertSummary(alerts);
  },
};