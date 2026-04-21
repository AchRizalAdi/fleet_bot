function formatDocumentStatus(result) {
  if (!result) return "Data surat kendaraan tidak ditemukan.";

  return [
    `SURAT ${result.plate}`,
    `STNK: ${result.documents.STNK || "-"}`,
    `KIR: ${result.documents.KIR || "-"}`,
    `PAJAK: ${result.documents.PAJAK || "-"}`,
    `Status: ${result.status}`,
  ].join("\n");
}

module.exports = {
  name: "CEK_SURAT",
  permission: "CEK_SURAT",
  pattern: /^CEK SURAT\s+([A-Z0-9-]+)$/,
  async execute({ match, services }) {
    const result = await services.fleetService.getVehicleDocuments(match[1]);
    return formatDocumentStatus(result);
  },
};