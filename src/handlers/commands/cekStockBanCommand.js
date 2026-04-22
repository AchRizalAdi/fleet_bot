function formatTireStock(stock) {
  if (!stock) return "Stock ban tidak ditemukan.";

  return stock
    .map((stock, i) => {
      return [
        `📦 *STOK #${i + 1}*`,
        `🔹 ${stock.item_name}`,
        `🏢 ${stock.warehouse_name}`,
        `📊 ${stock.available_qty} / Min ${stock.minimal_stock}`,
        ``,
      ].join("\n");
    })
    .join("\n");
}

module.exports = {
  name: "CEK_STOCK_BAN",
  permission: "CEK_STOCK_BAN",
  pattern: /^CEK STOCK BAN$/,
  async execute({ match, services }) {
    const stock = await services.fleetService.getTireStock();
    return formatTireStock(stock);
  },
};
