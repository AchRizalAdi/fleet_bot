function formatTireStock(stock) {
  if (!stock) return "Stock ban tidak ditemukan.";

  return stock
    .map((stock, i) => {
      return [
        // `STOK #${i + 1}`,
        `📦`,
        `Gudang    : ${stock.warehouse_name}`,
        `Item      : ${stock.item_name}`,
        `Tersedia  : ${stock.available_qty}`,
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
