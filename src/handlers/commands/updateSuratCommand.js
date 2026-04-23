function formatUpdateSuratVehicleNotFound({ plate }) {
  return [
    "DATA KENDARAAN TIDAK DITEMUKAN",
    "",
    `Plat: ${plate}`,
  ].join("\n");
}

function isEnabled(value) {
  return String(value || "").trim() === "1";
}

function getDocumentMeta(vehicle = {}) {
  return [
    {
      key: "STNK",
      label: "STNK",
      enabled: isEnabled(vehicle.has_stnk),
      value: vehicle.stnk_date,
      field: "stnk_date",
    },
    {
      key: "KIR",
      label: "KIR",
      enabled: isEnabled(vehicle.has_kir),
      value: vehicle.kir_date,
      field: "kir_date",
    },
    {
      key: "B3",
      label: "B3",
      enabled: isEnabled(vehicle.has_b3),
      value: vehicle.b3_jatuh_tempo,
      field: "b3_jatuh_tempo",
    },
    {
      key: "STID",
      label: "STID",
      enabled: isEnabled(vehicle.has_stid),
      value: vehicle.stid_date,
      field: "stid_date",
    },
    {
      key: "GPS1",
      label: "GPS1",
      enabled: isEnabled(vehicle.has_gps_global),
      value: vehicle.gps1_date_end,
      field: "gps1_date_end",
    },
    {
      key: "GPS2",
      label: "GPS2",
      enabled: isEnabled(vehicle.has_gps_ud_truck),
      value: vehicle.gps2_date_end,
      field: "gps2_date_end",
    },
    {
      key: "GPS3",
      label: "GPS3",
      enabled: isEnabled(vehicle.has_gps_mc_easy),
      value: vehicle.gps3_date_end,
      field: "gps3_date_end",
    },
    {
      key: "INSURANCE",
      label: "INSURANCE",
      enabled: isEnabled(vehicle.has_insurance),
      value: vehicle.insurance_expired_date,
      field: "insurance_expired_date",
    },
  ];
}

function formatVehicleDate(value) {
  return value ? value : "-";
}

function formatUpdateSuratVehicleSummary(vehicle) {
  const docs = getDocumentMeta(vehicle);
  const availableDocs = docs.filter((doc) => doc.enabled);

  if (availableDocs.length === 0) {
    return [
      "UPDATE SURAT",
      "",
      `Plat: ${vehicle.nopol || "-"}`,
      `Cabang: ${vehicle.company_name || "-"}`,
      "",
      "Tidak ada dokumen yang bisa diperbarui untuk kendaraan ini.",
    ].join("\n");
  }

  const lines = ["UPDATE SURAT", "", `Plat: ${vehicle.nopol || "-"}`, `Cabang: ${vehicle.company_name || "-"}`, "", "Data saat ini:"];

  docs.forEach((doc) => {
    lines.push(`- ${doc.label}: ${formatVehicleDate(doc.value)}`);
  });

  const available = availableDocs.map((doc) => doc.label);

  lines.push("");
  lines.push("Pilih dokumen yang ingin diperbarui:");
  available.forEach((label) => {
    lines.push(`- ${label}`);
  });
  lines.push("");
  lines.push("Ketik BATAL untuk membatalkan.");

  return lines.join("\n");
}

module.exports = {
  name: "UPDATE_SURAT",
  permission: "UPDATE_SURAT",
  pattern: /^UPDATE SURAT\s+(.+)$/,
  async execute({ match, sender, replyTo, services }) {
    const rawPlate = match[1] || "";
    const plate = String(rawPlate).trim().replace(/\s+/g, " ").toUpperCase();

    if (!plate) {
      return "Format salah. Contoh: UPDATE SURAT B 2424 BK";
    }
    // console.log("Received UPDATE SURAT command for plate:", plate);
    logger.info({ sender, plate }, "Received UPDATE SURAT command");
    const vehicles = await services.fleetService.getVehicleDocuments({ nopol: plate });
    const vehicle = Array.isArray(vehicles) ? vehicles[0] : null;

    if (!vehicle) {
      return formatUpdateSuratVehicleNotFound({ plate });
    }

    await services.sessionService.setSession({
      sender,
      replyTo,
      value: {
        flow: "UPDATE_SURAT",
        step: "WAITING_DOCUMENT_SELECTION",
        data: {
          plate: vehicle.nopol || plate,
          vehicle,
        },
      },
    });

    return formatUpdateSuratVehicleSummary(vehicle);
  },
};