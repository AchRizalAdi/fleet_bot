function normalizeDate(value) {
  return value || "-";
}

function formatVehicleDocument(vehicle) {
  return [
    "CEK SURAT",
    "",
    `Plat: ${vehicle.nopol || "-"}`,
    `Cabang: ${vehicle.company_name || "-"}`,
    `STNK: ${normalizeDate(vehicle.stnk_date)}`,
    `KIR: ${normalizeDate(vehicle.kir_date)}`,
    `B3: ${normalizeDate(vehicle.b3_jatuh_tempo)}`,
    `STID: ${normalizeDate(vehicle.stid_date)}`,
    `GPS1: ${normalizeDate(vehicle.gps1_date_end)}`,
    `GPS2: ${normalizeDate(vehicle.gps2_date_end)}`,
    `GPS3: ${normalizeDate(vehicle.gps3_date_end)}`,
    `INSURANCE: ${normalizeDate(vehicle.insurance_expired_date)}`,
  ].join("\n");
}

module.exports = {
  name: "CEK_SURAT",
  permission: "CEK_SURAT",
  pattern: /^CEK SURAT\s+(.+)$/,
  async execute({ match, services }) {
    const rawPlate = match[1] || "";
    const plate = String(rawPlate).trim().replace(/\s+/g, " ").toUpperCase();

    if (!plate) {
      return "Format salah. Contoh: CEK SURAT B 9019 UEK";
    }

    const result = await services.fleetService.getVehicleDocuments(plate);
    const vehicle = Array.isArray(result) ? result[0] : null;

    if (!vehicle) {
      return "Data kendaraan tidak ditemukan.";
    }

    return formatVehicleDocument(vehicle);
  },
};
