module.exports = {
  name: "CEK_SURAT",
  permission: "CEK_SURAT",
  pattern: /^CEK SURAT\s+([A-Z0-9-]+)$/,
  async execute({ match, services, utils }) {
    const result = await services.fleetService.getVehicleDocuments(match[1]);
    return utils.formatDocumentStatus(result);
  },
};