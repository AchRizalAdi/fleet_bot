function formatDefaultReply({ user }) {
  const { name, role } = user;

  const lines = [];

  lines.push("*CIMI ASSISTANT*");
  lines.push("");
  lines.push(`Selamat datang di CIMI Assistant, ${name || "Pengguna"}.`);
  lines.push("");

  lines.push("INFORMASI AKUN");
  lines.push(`Nama : ${name || "-"}`);
  lines.push(`Role : ${role?.toUpperCase() || "-"}`);

  lines.push("");
  lines.push("Ketik *HELP* untuk daftar perintah.");

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
  formatUserActivatedMessage,
  formatRegistrationPending,
  formatAccountDisabled,
  formatNoAccess,
  formatGenericSystemError,
};
