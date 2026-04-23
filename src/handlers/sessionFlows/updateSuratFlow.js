function formatUpdateSuratAskDocumentType() {
  return [
    "Silakan masukkan jenis surat:",
    "- STNK",
    "- KIR",
    "",
    "Ketik BATAL untuk membatalkan.",
  ].join("\n");
}

function formatUpdateSuratAskExpiryDate({ plate, type }) {
  return [
    "UPDATE SURAT",
    "",
    `Plat : ${plate || "-"}`,
    `Jenis: ${type || "-"}`,
    "",
    "Masukkan tanggal expired (format YYYY-MM-DD).",
    "Contoh: 2026-12-31",
    "",
    "Ketik BATAL untuk membatalkan.",
  ].join("\n");
}

function formatUpdateSuratInvalidDocumentType() {
  return "Jenis surat tidak valid. Pilih STNK atau KIR.";
}

function formatUpdateSuratInvalidDate() {
  return "Format tanggal tidak valid. Gunakan format YYYY-MM-DD.";
}

function formatUpdateSuratSuccess({ plate, type, expiryDate }) {
  return [
    "UPDATE SURAT BERHASIL",
    "",
    `Plat   : ${plate || "-"}`,
    `Jenis  : ${type || "-"}`,
    `Expired: ${expiryDate || "-"}`,
  ].join("\n");
}

function isValidDateYmd(value = "") {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false;

  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;

  return date.toISOString().slice(0, 10) === normalized;
}

async function handleWaitDocumentType({ session, sender, replyTo, text, sessionService }) {
  const input = String(text || "").trim().toUpperCase();

  if (input !== "STNK" && input !== "KIR") {
    return [formatUpdateSuratInvalidDocumentType(), "", formatUpdateSuratAskDocumentType()].join("\n");
  }

  const next = await sessionService.updateSession({
    sender,
    replyTo,
    patch: {
      step: "WAITING_EXPIRY_DATE",
      data: {
        type: input,
      },
    },
  });

  return formatUpdateSuratAskExpiryDate({
    plate: next.data.plate,
    type: next.data.type,
  });
}

async function handleWaitExpiryDate({ session, sender, replyTo, text, sessionService, fleetService, auditRepository, user }) {
  const expiryDate = String(text || "").trim();
  if (!isValidDateYmd(expiryDate)) {
    return formatUpdateSuratInvalidDate();
  }

  const plate = session.data && session.data.plate;
  const type = session.data && session.data.type;

  await fleetService.updateVehicleDocument({
    plate,
    type,
    expiryDate,
    actor: sender,
  });

  if (auditRepository && user) {
    await auditRepository.createLog({
      action: "UPDATE_SURAT",
      actorName: user.name,
      actorJid: sender,
      actorRole: user.role,
      target: plate,
      payload: {
        plate,
        type,
        expiryDate,
      },
    });
  }

  await sessionService.clearSession({ sender, replyTo });

  return formatUpdateSuratSuccess({
    plate,
    type,
    expiryDate,
  });
}

async function handle({ session, sender, replyTo, text, user, sessionService, fleetService, auditRepository, logger }) {
  if (session.flow !== "UPDATE_SURAT") {
    logger.warn({ sender, replyTo, flow: session.flow }, "Flow module received unsupported session flow");
    throw new Error(`Unsupported flow: ${session.flow}`);
  }

  if (session.step === "WAITING_DOCUMENT_TYPE") {
    return handleWaitDocumentType({ session, sender, replyTo, text, sessionService });
  }

  if (session.step === "WAITING_EXPIRY_DATE") {
    return handleWaitExpiryDate({ session, sender, replyTo, text, sessionService, fleetService, auditRepository, user });
  }

  logger.warn({ sender, replyTo, step: session.step }, "Unknown UPDATE_SURAT session step");
  throw new Error(`Unknown UPDATE_SURAT step: ${session.step}`);
}

module.exports = {
  flow: "UPDATE_SURAT",
  handle,
  formatUpdateSuratAskDocumentType,
  formatUpdateSuratAskExpiryDate,
  formatUpdateSuratInvalidDocumentType,
  formatUpdateSuratInvalidDate,
  formatUpdateSuratSuccess,
};
