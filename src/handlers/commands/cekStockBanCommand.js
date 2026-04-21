function formatTireStock(stock) {
  if (!stock) return "Stock ban tidak ditemukan.";

  return [
    `STOCK BAN ${stock.sku}`,
    `Merek: ${stock.brand}`,
    `Tersedia: ${stock.available}`,
    `Minimum: ${stock.minimum}`,
    `Status: ${stock.available <= stock.minimum ? "Perlu restock" : "Aman"}`,
  ].join("\n");
}

module.exports = {
  name: "CEK_STOCK_BAN",
  permission: "CEK_STOCK_BAN",
  pattern: /^CEK STOCK BAN\s+(.+)$/,
  async execute({ match, services }) {
    const stock = await services.fleetService.getTireStock(match[1].trim());
    return formatTireStock(stock);
  },
};