function isValidDateYmd(value = "") {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false;

  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;

  return date.toISOString().slice(0, 10) === normalized;
}

function isEnabled(value) {
  return String(value || "").trim() === "1";
}

function getDocumentDefinitions(vehicle = {}) {
  return [
    {
      code: "STNK",
      label: "STNK",
      enabled: isEnabled(vehicle.has_stnk),
      currentValue: vehicle.stnk_date,
      backendField: "stnk_date",
    },
    {
      code: "KIR",
      label: "KIR",
      enabled: isEnabled(vehicle.has_kir),
      currentValue: vehicle.kir_date,
      backendField: "kir_date",
    },
    {
      code: "B3",
      label: "B3",
      enabled: isEnabled(vehicle.has_b3),
      currentValue: vehicle.b3_jatuh_tempo,
      backendField: "b3_jatuh_tempo",
    },
    {
      code: "STID",
      label: "STID",
      enabled: isEnabled(vehicle.has_stid),
      currentValue: vehicle.stid_date,
      backendField: "stid_date",
    },
    {
      code: "GPS1",
      label: "GPS1",
      enabled: isEnabled(vehicle.has_gps_global),
      currentValue: vehicle.gps1_date_end,
      backendField: "gps1_date_end",
    },
    {
      code: "GPS2",
      label: "GPS2",
      enabled: isEnabled(vehicle.has_gps_ud_truck),
      currentValue: vehicle.gps2_date_end,
      backendField: "gps2_date_end",
    },
    {
      code: "GPS3",
      label: "GPS3",
      enabled: isEnabled(vehicle.has_gps_mc_easy),
      currentValue: vehicle.gps3_date_end,
      backendField: "gps3_date_end",
    },
    {
      code: "INSURANCE",
      label: "INSURANCE",
      enabled: isEnabled(vehicle.has_insurance),
      currentValue: vehicle.insurance_expired_date,
      backendField: "insurance_expired_date",
    },
  ];
}

function formatValue(value) {
  return value || "-";
}

function formatSelectionOptions(documents) {
  return documents
    .filter((document) => document.enabled)
    .map((document) => `- ${document.label}`)
    .join("\n");
}

function formatVehicleSummary(session) {
  const vehicle = session.data.vehicle || {};
  const documents = getDocumentDefinitions(vehicle);

  return [
    "UPDATE SURAT",
    "",
    `Plat: ${vehicle.nopol || session.data.plate || "-"}`,
    `Cabang: ${vehicle.company_name || "-"}`,
    "",
    "Data saat ini:",
    ...documents.map((document) => `- ${document.label}: ${formatValue(document.currentValue)}`),
    "",
    "Pilih dokumen yang ingin diperbarui:",
    formatSelectionOptions(documents),
    "",
    "Ketik BATAL untuk membatalkan.",
  ].join("\n");
}

function formatSelectionPrompt(session) {
  const vehicle = session.data.vehicle || {};
  const documents = getDocumentDefinitions(vehicle);

  return ["Pilihan dokumen tidak valid.", "", "Pilih salah satu dokumen berikut:", formatSelectionOptions(documents), "", "Ketik BATAL untuk membatalkan."].join("\n");
}

function formatExpiryPrompt({ plate, documentLabel }) {
  return [
    "UPDATE SURAT",
    "",
    `Plat: ${plate || "-"}`,
    `Dokumen: ${documentLabel || "-"}`,
    "",
    `Silakan masukkan tanggal berlaku baru untuk ${documentLabel || "dokumen ini"}`,
    "Format: YYYY-MM-DD",
    "",
    "Ketik BATAL untuk membatalkan.",
  ].join("\n");
}

function formatInvalidDate() {
  return "Format tanggal tidak valid. Gunakan format YYYY-MM-DD.";
}

function formatUpdateSuccess({ plate, documentLabel, expiryDate }) {
  return ["UPDATE SURAT BERHASIL", "", `Plat: ${plate || "-"}`, `Dokumen: ${documentLabel || "-"}`, `Tanggal berlaku baru: ${expiryDate || "-"}`].join("\n");
}

function formatGenericSessionError() {
  return "Terjadi gangguan sistem. Silakan coba lagi nanti.";
}

function resolveDocumentBySelection(session, selection) {
  const documents = getDocumentDefinitions(session.data.vehicle || {});
  const normalized = String(selection || "")
    .trim()
    .toUpperCase();
  return documents.find((document) => document.enabled && document.code === normalized) || null;
}

async function handleWaitDocumentSelection({ session, sender, replyTo, text, sessionService }) {
  const selection = String(text || "")
    .trim()
    .toUpperCase();
  const document = resolveDocumentBySelection(session, selection);

  if (!document) {
    return formatSelectionPrompt(session);
  }

  await sessionService.updateSession({
    sender,
    replyTo,
    patch: {
      step: "WAITING_EXPIRY_DATE",
      data: {
        selectedDocument: document.code,
      },
    },
  });

  const plate = session.data.vehicle?.nopol || session.data.plate;
  return formatExpiryPrompt({ plate, documentLabel: document.label });
}

async function handleWaitExpiryDate({ session, sender, replyTo, text, sessionService, fleetService, auditRepository, user, logger }) {
  const expiryDate = String(text || "").trim();
  if (!isValidDateYmd(expiryDate)) {
    return formatInvalidDate();
  }

  const vehicle = session.data.vehicle || {};
  const plate = vehicle.nopol || session.data.plate;
  const vehicleId = session.data.vehicleId || vehicle.id;
  const documentLabel = session.data.selectedDocument;
  const document = resolveDocumentBySelection(session, documentLabel);

  if (!document) {
    logger.warn({ sender, replyTo, plate, documentLabel }, "Selected document missing or invalid during expiry update");
    await sessionService.clearSession({ sender, replyTo });
    return formatGenericSessionError();
  }

  const updateResult = await fleetService.updateVehicleDocument({
    vehicleId,
    documentType: document.code,
    expiryDate,
    actor: sender,
  });

  if (!updateResult?.ok) {
    await sessionService.clearSession({ sender, replyTo });

    if (updateResult?.notFound) {
      return "Data kendaraan tidak ditemukan.";
    }

    return ["Sistem backend sedang tidak tersedia.", "Silakan coba lagi nanti."].join("\n");
  }

  if (auditRepository && user) {
    await auditRepository.createLog({
      action: "UPDATE_SURAT",
      actorName: user.name,
      actorJid: sender,
      actorRole: user.role,
      target: plate,
      payload: JSON.stringify({
        plate,
        vehicleId,
        type: document.code,
        expiryDate,
      }),
    });
  }

  await sessionService.clearSession({ sender, replyTo });

  return formatUpdateSuccess({
    plate,
    documentLabel: document.label,
    expiryDate,
  });
}

async function handle({ session, sender, replyTo, text, user, sessionService, fleetService, auditRepository, logger }) {
  if (session.flow !== "UPDATE_SURAT") {
    logger.warn({ sender, replyTo, flow: session.flow }, "Flow module received unsupported session flow");
    throw new Error(`Unsupported flow: ${session.flow}`);
  }

  if (session.step === "WAITING_DOCUMENT_SELECTION") {
    return handleWaitDocumentSelection({ session, sender, replyTo, text, sessionService });
  }

  if (session.step === "WAITING_EXPIRY_DATE") {
    return handleWaitExpiryDate({ session, sender, replyTo, text, sessionService, fleetService, auditRepository, user, logger });
  }

  logger.warn({ sender, replyTo, step: session.step }, "Unknown UPDATE_SURAT session step");
  throw new Error(`Unknown UPDATE_SURAT step: ${session.step}`);
}

module.exports = {
  flow: "UPDATE_SURAT",
  handle,
  getDocumentDefinitions,
  resolveDocumentBySelection,
  formatVehicleSummary,
  formatSelectionPrompt,
  formatExpiryPrompt,
  formatUpdateSuccess,
};
