module.exports = {
  name: "REJECT_USER",
  permission: "REJECT_USER",
  pattern: /^REJECT\s+([A-Z0-9-]+)$/,
  async execute({ match, sender, authCacheService, repositories, user }) {
    const [, code] = match;

    const result = await repositories.userRepository.rejectPendingUser({
      code,
      rejectedBy: sender,
    });

    if (!result) {
      return `Kode ${code} tidak ditemukan atau sudah diproses.`;
    }

    const rejectedJid = result?.jid || result?.pending?.jid || null;

    if (rejectedJid && authCacheService?.invalidateUser) {
      await authCacheService.invalidateUser(rejectedJid);
    }

    await repositories.auditRepository.createLog({
      action: "REJECT_USER",
      actorName: user.name,
      actorJid: sender,
      actorRole: user.role,
      target: result.jid,
      payload: JSON.stringify({
        code,
      }),
    });

    return `User berhasil di-reject.\nKode: ${code}`;
  },
};
