module.exports = {
  name: "UPDATE_SURAT",
  permission: "UPDATE_SURAT",
  pattern: /^UPDATE SURAT\s+([A-Z0-9-]+)\s+([A-Z]+)\s+(\d{4}-\d{2}-\d{2})$/,
  async execute({ match, sender, services, repositories, user }) {
    const [, plate, type, expiryDate] = match;

    await services.fleetService.updateVehicleDocument({
      plate,
      type,
      expiryDate,
      actor: sender,
    });

    await repositories.auditRepository.createLog({
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

    return `UPDATE SURAT berhasil\nPlat: ${plate}\nJenis: ${type}\nExpired: ${expiryDate}`;
  },
};