function formatDocumentStatus(result) {
  if (!result) return "Data surat kendaraan tidak ditemukan.";

  const docs = result.documents || {};
  const yesNo = (value) => (value ? "Ya" : "Tidak");

  return [
    "INFORMASI DOKUMEN KENDARAAN",
    `Cabang : ${result.branch || "-"}`,
    `Nopol  : ${result.plate || "-"}`,
    `Status : ${result.status || "-"}`,
    "",
    "Kelengkapan:",
    `- STNK      : ${yesNo(docs.HAS_STNK)}`,
    `- KIR       : ${yesNo(docs.HAS_KIR)}`,
    `- B3        : ${yesNo(docs.HAS_B3)}`,
    `- STID      : ${yesNo(docs.HAS_STID)}`,
    `- GPS UdTruck : ${yesNo(docs.HAS_GPS2)}`,
    `- GPS MCEasy  : ${yesNo(docs.HAS_GPS3)}`,
    `- Insurance : ${yesNo(docs.HAS_INSURANCE)}`,
    "",
    "Detail Dokumen:",
    `- STNK      : ${docs.STNK_NO || "-"} | Exp: ${docs.STNK_DATE || "-"}`,
    `- KIR       : ${docs.KIR_NO || "-"} | Exp: ${docs.KIR_DATE || "-"}`,
    `- B3        : ${docs.B3_NO || "-"} | Exp: ${docs.B3_DATE || "-"}`,
    `- STID      : ${docs.STID_NO || "-"} | Exp: ${docs.STID_DATE || "-"}`,
    `- GPS UdTruck Exp: ${docs.UDFLEET_DATE || "-"}`,
    `- GPS MCEasy Exp : ${docs.MCEASY_DATE || "-"}`,
    `- Insurance : ${docs.INSURANCE_NAME || "-"} (${docs.INSURANCE_NO || "-"}) | Exp: ${docs.INSURANCE_DATE || "-"}`,
  ].join("\n");
}

function normalizeDate(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return value;
}

function mapVehicleToDocumentStatus(vehicle) {
  if (!vehicle) return null;

  const hasStnk = String(vehicle.has_stnk ?? "") === "1";
  const hasKir = String(vehicle.has_kir ?? "") === "1";
  const hasB3 = String(vehicle.has_b3 ?? "") === "1";
  const hasStid = String(vehicle.has_stid ?? "") === "1";
  const hasGps2 = String(vehicle.has_gps_ud_truck ?? "") === "1";
  const hasGps3 = String(vehicle.has_gps_mc_easy ?? "") === "1";
  const hasInsurance = String(vehicle.has_insurance ?? "") === "1";

  const status = hasStnk && hasKir && hasB3 && hasStid && hasGps2 && hasGps3 && hasInsurance
    ? "Lengkap"
    : "Tidak Lengkap";

  return {
    branch: vehicle.company_name || "-",
    plate: vehicle.nopol || vehicle.plate || "-",
    documents: {
      HAS_STNK: vehicle.has_stnk == "1" ? true : false,
      HAS_KIR: vehicle.has_kir == "1" ? true : false,
      HAS_B3: vehicle.has_b3 == "1" ? true : false,
      HAS_STID: vehicle.has_stid == "1" ? true : false,
      HAS_GPS2: vehicle.has_gps_ud_truck == "1" ? true : false,
      HAS_GPS3: vehicle.has_gps_mc_easy == "1" ? true : false,
      HAS_INSURANCE: vehicle.has_insurance == "1" ? true : false,
      STNK_NO: vehicle.stnk_no || "-",
      STNK_DATE: vehicle.stnk_date ? normalizeDate(vehicle.stnk_date) : "-",
      KIR_NO: vehicle.kir_no || "-",
      KIR_DATE: vehicle.kir_date ? normalizeDate(vehicle.kir_date) : "-",
      B3_NO: vehicle.b3_sertificate_no || "-",
      B3_DATE: vehicle.b3_jatuh_tempo ? normalizeDate(vehicle.b3_jatuh_tempo) : "-",
      STID_NO: vehicle.stid_card_no || "-",
      STID_DATE: vehicle.stid_jatuh_tempo ? normalizeDate(vehicle.stid_jatuh_tempo) : "-",
      UDFLEET_DATE: vehicle.gps2_date_end ? normalizeDate(vehicle.gps2_date_end) : "-",
      MCEASY_DATE: vehicle.gps3_date_end ? normalizeDate(vehicle.gps3_date_end) : "-",
      INSURANCE_NO: vehicle.insurance_no || "-",
      INSURANCE_NAME: vehicle.insurance_name || "-",
      INSURANCE_DATE: vehicle.insurance_expired_date ? normalizeDate(vehicle.insurance_expired_date) : "-",
    },
    status,
  };
}

function normalizeVehicleList(result) {
  if (Array.isArray(result)) {
    return result.map(mapVehicleToDocumentStatus).filter(Boolean);
  }

  if (Array.isArray(result?.data)) {
    return result.data.map(mapVehicleToDocumentStatus).filter(Boolean);
  }

  if (!result) {
    return [];
  }

  const singleVehicle = mapVehicleToDocumentStatus(result);
  return singleVehicle ? [singleVehicle] : [];
}

module.exports = {
  name: "CEK_SURAT",
  permission: "CEK_SURAT",
  pattern: /^CEK SURAT$/,
  async execute({ match, services }) {
    const result = await services.fleetService.getVehicleDocuments();

    const vehicles = normalizeVehicleList(result);
    if (vehicles.length === 0) {
      return "Data surat kendaraan tidak ditemukan.";
    }

    return vehicles.map(formatDocumentStatus).join("\n\n");
  },
};