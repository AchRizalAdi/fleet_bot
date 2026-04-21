function formatDefaultReplyShortVer({ user }) {
  const { name, role } = user;

  const lines = [];

  lines.push("CIMI BOT");
  lines.push("");
  lines.push("Sistem bantuan operasional melalui WhatsApp.");
  lines.push("");

  lines.push("INFORMASI AKUN");
  lines.push(`Nama : ${name || "-"}`);
  lines.push(`Role : ${role?.toUpperCase() || "-"}`);
  lines.push("");

  lines.push("FITUR TERSEDIA");
  lines.push("- Cek surat kendaraan");
  lines.push("- Cek stok ban");
  lines.push("- Lihat alert harian");
  lines.push("- Update surat kendaraan");
  lines.push("- Update pemakaian ban");
  lines.push("- Kelola registrasi user");

  lines.push("");
  lines.push("Ketik *HELP* untuk daftar perintah.");

  return lines.join("\n");
}

function formatDefaultReply({ user }) {
  const { jid, name, role } = user;

  const lines = ["CIMI BOT", ""];
  lines.push("Bot ini digunakan untuk membantu operasional kendaraan melalui WhatsApp.");

  lines.push("");

  lines.push("AKUN ANDA");
  lines.push(`Nama: ${name || "-"}`);
  lines.push(`Role: ${role.toUpperCase()}`);

  lines.push("");

  lines.push("FITUR UNTUK ANDA");

  lines.push("- cek surat kendaraan");
  lines.push("- cek stok ban");
  lines.push("- melihat alert harian");

  if (role === "operator" || role === "admin") {
    lines.push("- update surat kendaraan");
    lines.push("- update pemakaian ban kendaraan");
  }

  if (role === "admin") {
    lines.push("- kelola registrasi user");
  }

  lines.push("");
  lines.push("Ketik HELP untuk melihat daftar command.");

  return lines.join("\n");
}

function formatUserActivatedMessage({ name, role }) {
  return ["AKUN ANDA TELAH DIAKTIFKAN", "", `Nama: ${name}`, `Role: ${role.toUpperCase()}`, "", "Ketik HELP untuk melihat daftar command."].join("\n");
}

function formatRegistrationPending({ code }) {
  return `Akun Anda belum terdaftar.\nKode registrasi: ${code}\nHubungi admin untuk aktivasi.`;
}

function formatAccountDisabled() {
  return "Akun Anda dinonaktifkan. Hubungi admin untuk bantuan.";
}

function formatNoAccess() {
  return "Tidak punya akses.";
}

function formatGenericSystemError() {
  return "Terjadi gangguan sistem. Silakan coba lagi nanti.";
}

module.exports = {
  formatDefaultReply,
  formatDefaultReplyShortVer,
  formatUserActivatedMessage,
  formatRegistrationPending,
  formatAccountDisabled,
  formatNoAccess,
  formatGenericSystemError,
};
