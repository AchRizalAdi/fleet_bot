module.exports = {
  name: "UPDATE_BAN",
  permission: "UPDATE_BAN",
  pattern: /^UPDATE BAN\s+([A-Z0-9-]+)\s+([A-Z_]+)\s+(\d+)$/,
  async execute({ match, sender, services, repositories, user }) {
    const [, plate, position, km] = match;

    await services.fleetService.updateTireUsage({
      plate,
      position,
      km: Number(km),
      actor: sender,
    });

    await repositories.auditRepository.createLog({
      action: "UPDATE_BAN",
      actorName: user.name,
      actorJid: sender,
      actorRole: user.role,
      target: plate,
      payload: {
        plate,
        position,
        km: Number(km),
      },
    });

    return `UPDATE BAN berhasil\nPlat: ${plate}\nPosisi: ${position}\nKM: ${km}`;
  },
};