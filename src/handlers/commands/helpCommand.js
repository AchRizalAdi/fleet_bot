function formatHelp(role = "viewer") {
  const lines = ["FLEET OPS BOT", "", "DAFTAR COMMAND"];

  lines.push("");
  lines.push("CEK DATA");
  lines.push("- CEK SURAT <PLAT>");
  lines.push("- CEK STOCK BAN <SKU>");
  lines.push("- ALERT HARI INI");

  if (role === "operator" || role === "admin") {
    lines.push("");
    lines.push("UPDATE DATA");
    lines.push("- UPDATE SURAT <PLAT> <JENIS> <YYYY-MM-DD>");
    lines.push("- UPDATE BAN <PLAT> <POSISI> <KM>");
  }

  if (role === "admin") {
    lines.push("");
    lines.push("ADMIN");
    lines.push("- LIST PENDING USER");
    lines.push("- APPROVE <CODE> <ROLE> <NAMA>");
    lines.push("- REJECT <CODE>");
    lines.push("- LOG TERAKHIR");
    lines.push("  (ROLE: VIEWER, OPERATOR, ADMIN)");
  }

  lines.push("");
  lines.push("Gunakan format sesuai contoh di atas.");

  return lines.join("\n");
}

module.exports = {
  name: "HELP",
  permission: "HELP",
  pattern: /^HELP$/,
  async execute({ user }) {
    return formatHelp(user.role);
  },
};