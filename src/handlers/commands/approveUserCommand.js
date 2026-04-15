module.exports = {
  name: "APPROVE_USER",
  permission: "APPROVE_USER",
  pattern: /^APPROVE\s+([A-Z0-9-]+)\s+(VIEWER|OPERATOR|ADMIN)\s+(.+)$/,
  async execute({ match, sender, repositories, utils, sendText, logger, user }) {
    const [, code, role, name] = match;

    const result = await repositories.userRepository.approvePendingUser({
      code,
      role,
      name,
      approvedBy: sender,
    });

    if (!result) {
      return `Kode ${code} tidak ditemukan atau sudah diproses.`;
    }

    await repositories.auditRepository.createLog({
      action: "APPROVE_USER",
      actorName: user.name,
      actorJid: sender,
      actorRole: user.role,
      target: result.pending.jid,
      payload: {
        code,
        approvedRole: role,
        approvedName: name,
      },
    });

    try {
      if (sendText && result.pending?.jid) {
        await sendText(result.pending.jid, utils.formatUserActivatedMessage({ name, role }));
      }
    } catch (err) {
      logger.error({ err, jid: result.pending?.jid }, "Failed sending activation message");
    }

    return ["USER BERHASIL DIAKTIFKAN", "", `Nama: ${name}`, `Role: ${role}`].join("\n");
  },
};