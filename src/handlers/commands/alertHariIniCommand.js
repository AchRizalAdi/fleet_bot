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

module.exports = {
  name: "ALERT_HARI_INI",
  permission: "ALERT_HARI_INI",
  pattern: /^ALERT HARI INI$/,
  async execute({ services }) {
    const alerts = await services.fleetService.getTodayAlerts();
    return formatAlertSummary(alerts);
  },
};