module.exports = {
  name: "VIEW_AUDIT_LOG",
  permission: "VIEW_AUDIT_LOG",
  pattern: /^LOG TERAKHIR$/,
  async execute({ repositories }) {
    const logs = await repositories.auditRepository.getLogs(10);

    if (logs.length === 0) {
      return "Belum ada audit log.";
    }

    return [
      "AUDIT LOG TERAKHIR",
      "",
      ...logs.map((log, index) => {
        return `${index + 1}. ${log.action}
          Pelaku: ${log.actorName}
          Target: ${log.target || "-"}
          Waktu: ${log.createdAt}`;
      }),
    ].join("\n\n");
  },
};