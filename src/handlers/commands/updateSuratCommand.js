function formatUpdateSuratStartSession({ plate }) {
  return [
    "UPDATE SURAT",
    "",
    `Plat: ${plate}`,
    "",
    "Silakan masukkan jenis surat:",
    "- STNK",
    "- KIR",
    "",
    "Ketik BATAL untuk membatalkan.",
  ].join("\n");
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

    await services.sessionService.setSession({
      sender,
      replyTo,
      value: {
        flow: "UPDATE_SURAT",
        step: "WAITING_DOCUMENT_TYPE",
        data: {
          plate,
        },
      },
    });

    return formatUpdateSuratStartSession({ plate });
  },
};