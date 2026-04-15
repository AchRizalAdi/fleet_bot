function formatHelp(role = "viewer") {
  const lines = ["DAFTAR COMMAND"];

  // ======================
  // VIEWER
  // ======================
  lines.push("");
  lines.push("CEK DATA:");
  lines.push("- CEK SURAT <PLAT>");
  lines.push("- CEK STOCK BAN <SKU>");
  lines.push("- ALERT HARI INI");

  // ======================
  // OPERATOR
  // ======================
  if (role === "operator" || role === "admin") {
    lines.push("");
    lines.push("UPDATE DATA:");
    lines.push("- UPDATE SURAT <PLAT> <JENIS> <YYYY-MM-DD>");
    lines.push("- UPDATE BAN <PLAT> <POSISI> <KM>");
  }

  // ======================
  // ADMIN
  // ======================
  if (role === "admin") {
    lines.push("");
    lines.push("ADMIN:");
    lines.push("- LIST PENDING USER");
    lines.push("- APPROVE <CODE> <ROLE>");
    lines.push("- REJECT <CODE>");
  }

  return lines.join("\n");
}

function formatDocumentStatus(result) {
  if (!result) return 'Data surat kendaraan tidak ditemukan.';
  return [
    `SURAT ${result.plate}`,
    `STNK: ${result.documents.STNK || '-'}`,
    `KIR: ${result.documents.KIR || '-'}`,
    `PAJAK: ${result.documents.PAJAK || '-'}`,
    `Status: ${result.status}`,
  ].join('\n');
}

function formatTireStock(stock) {
  if (!stock) return 'Stock ban tidak ditemukan.';
  return [
    `STOCK BAN ${stock.sku}`,
    `Merek: ${stock.brand}`,
    `Tersedia: ${stock.available}`,
    `Minimum: ${stock.minimum}`,
    `Status: ${stock.available <= stock.minimum ? 'Perlu restock' : 'Aman'}`,
  ].join('\n');
}

function formatAlertSummary(items) {
  if (!items.length) return 'Tidak ada alert hari ini.';
  return ['ALERT HARI INI', ...items.map((v, i) => `${i + 1}. ${v}`)].join('\n');
}

module.exports = {
  formatHelp,
  formatDocumentStatus,
  formatTireStock,
  formatAlertSummary,
};
