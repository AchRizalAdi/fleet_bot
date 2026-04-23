function formatAlertSummary(items) {
  if (!items || items.error) {
    return ["ALERT HARI INI", "", "Gagal mengambil data alert.", "Silakan coba lagi nanti."].join("\n");
  }

  if (!Array.isArray(items) || !items.length) {
    return ["ALERT HARI INI", "", "Tidak ada alert."].join("\n");
  }

  const limited = items.slice(0, 20);
  const lines = ["ALERT HARI INI", ""];

  limited.forEach((items, idx) => {
    lines.push(`${idx + 1}. ${items.nopol}`);
    lines.push(`Tipe: ${items.type || "-"}`);
    lines.push(`Judul: ${items.title || "-"}`);
    lines.push(`Pesan: ${items.notification_message || "-"}`);
    if (items.notification_created_at) {
      lines.push(`Waktu: ${items.notification_created_at}`);
    }
    if (items.customer_name) {
      lines.push(`Customer: ${items.customer_name}`);
    }
    // posisi use gmaps link    
    if (items.notif_lat && items.notif_lng) {
      lines.push(`Posisi: https://www.google.com/maps/search/?api=1&query=${items.notif_lat},${items.notif_lng}`);
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
    const alerts = await services.fleetService.getVehicleNotification();
    return formatAlertSummary(alerts);
  },
};