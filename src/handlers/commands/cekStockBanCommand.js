module.exports = {
  name: "CEK_STOCK_BAN",
  permission: "CEK_STOCK_BAN",
  pattern: /^CEK STOCK BAN\s+(.+)$/,
  async execute({ match, services, utils }) {
    const stock = await services.fleetService.getTireStock(match[1].trim());
    return utils.formatTireStock(stock);
  },
};