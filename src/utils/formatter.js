function formatHelp() {
  return [
    'Command tersedia:',
    'HELP',
    'CEK SURAT <PLAT>',
    'UPDATE SURAT <PLAT> <JENIS> <YYYY-MM-DD>',
    'CEK STOCK BAN <SKU>',
    'UPDATE BAN <PLAT> <POSISI> <KM>',
    'ALERT HARI INI',
  ].join('\n');
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
