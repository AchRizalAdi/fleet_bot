function formatHelp(permissions = []) {
  const permissionSet = new Set(permissions);

  const sections = [
    {
      title: "HELP COMMAND",
      groupPermission: "H_COM",
      commands: [
        { permission: "HELP", text: "HELP" },
        { permission: "AUDIT_LOG", text: "AUDIT LOG" },
      ],
    },
    {
      title: "USER MANAGEMENT",
      groupPermission: "U_MAN",
      commands: [
        { permission: "LIST_PENDING_USER", text: "LIST PENDING USER" },
        { permission: "APPROVE_USER", text: "APPROVE USER <CODE> <ROLES/SUPERADMIN/USER> <NAMA>" },
        { permission: "REJECT_USER", text: "REJECT USER <CODE>" },
      ],
    },
    {
      title: "VEHICLE MANAGEMENT",
      groupPermission: "V_MAN",
      commands: [
        { permission: "CEK_SURAT", text: "CEK SURAT <PLAT>" },
        { permission: "CEK_STOCK_BAN", text: "CEK STOCK BAN" },
        { permission: "ALERT_HARI_INI", text: "ALERT HARI INI" },
      ],
    },
  ];

  const lines = ["*FITUR BESERTA FORMAT PERINTAH*"];

  for (const section of sections) {
    if (!permissionSet.has(section.groupPermission)) continue;

    const allowedCommands = section.commands.filter((command) =>
      permissionSet.has(command.permission)
    );

    if (allowedCommands.length === 0) continue;

    lines.push("");
    lines.push(`*${section.title}*`);

    for (const command of allowedCommands) {
      lines.push(`- ${command.text}`);
    }
  }

  lines.push("");
  lines.push("Gunakan format sesuai contoh di atas.");

  return lines.join("\n");
}

module.exports = {
  name: "HELP",
  permission: "HELP",
  pattern: /^HELP$/i,
  async execute({ user }) {
    return formatHelp(user.permissions);
  },
};