module.exports = {
  name: "REJECT_USER",
  permission: "REJECT_USER",
  pattern: /^REJECT\s+([A-Z0-9-]+)$/,
  async execute({ match, sender, repositories, user }) {
    const [, code] = match;

    const result = await repositories.userRepository.rejectPendingUser({
      code,
      rejectedBy: sender,
    });

    if (!result) {
      return `Kode ${code} tidak ditemukan atau sudah diproses.`;
    }

    await repositories.auditRepository.createLog({
      action: "REJECT_USER",
      actorName: user.name,
      actorJid: sender,
      actorRole: user.role,
      target: result.jid,
      payload: {
        code,
      },
    });

    return `User berhasil di-reject.\nKode: ${code}`;
  },
};