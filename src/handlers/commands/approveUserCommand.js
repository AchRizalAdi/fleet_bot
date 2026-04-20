module.exports = {
  name: "APPROVE_USER",
  permission: "APPROVE_USER",
  pattern: /^APPROVE\s+([A-Z0-9-]+)\s+(VIEWER|OPERATOR|ADMIN)\s+(.+)$/,
  async execute({ match, sender, authCacheService, repositories, utils, sendText, logger, user }) {
    const [, code, role, name] = match;

    const result = await repositories.userRepository.approvePendingUser({
      code,
      role: role.toLowerCase(),
      name,
      approvedBy: sender,
    });

    if (!result) {
      return `Kode ${code} tidak ditemukan atau sudah diproses.`;
    }

    const approvedJid = result?.pending?.jid || result?.user?.jid || null;

    if (approvedJid && authCacheService?.invalidateUser) {
      await authCacheService.invalidateUser(approvedJid);
    }

    if (result?.user?.jid && authCacheService?.setAuth) {
      await authCacheService.setAuth(result.user.jid, result.user, 300);
    }

    await repositories.auditRepository.createLog({
      action: "APPROVE_USER",
      actorName: user.name,
      actorJid: sender,
      actorRole: user.role,
      target: approvedJid,
      payload: {
        code,
        approvedRole: role.toLowerCase(),
        approvedName: name,
      },
    });

    try {
      if (approvedJid && sendText) {
        await sendText(approvedJid, utils.formatUserActivatedMessage({ name, role }));
      }
    } catch (err) {
      logger.error({ err, jid: approvedJid }, "Failed sending activation message");
    }

    return ["USER BERHASIL DIAKTIFKAN", "", `Nama: ${name}`, `Role: ${role}`].join("\n");
  },
};