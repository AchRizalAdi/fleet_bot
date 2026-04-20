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
    // write roles that can be assigned to new user
    lines.push("  (ROLE: VIEWER, OPERATOR, ADMIN)");
  }

  lines.push("");
  lines.push("Gunakan format sesuai contoh di atas.");

  return lines.join("\n");
}

function formatDocumentStatus(result) {
  if (!result) return "Data surat kendaraan tidak ditemukan.";
  return [`SURAT ${result.plate}`, `STNK: ${result.documents.STNK || "-"}`, `KIR: ${result.documents.KIR || "-"}`, `PAJAK: ${result.documents.PAJAK || "-"}`, `Status: ${result.status}`].join("\n");
}

function formatTireStock(stock) {
  if (!stock) return "Stock ban tidak ditemukan.";
  return [
    `STOCK BAN ${stock.sku}`,
    `Merek: ${stock.brand}`,
    `Tersedia: ${stock.available}`,
    `Minimum: ${stock.minimum}`,
    `Status: ${stock.available <= stock.minimum ? "Perlu restock" : "Aman"}`,
  ].join("\n");
}

function formatAlertSummary(items) {
  if (!items || items.error) {
    return ["ALERT HARI INI", "", "Gagal mengambil data alert.", "Silakan coba lagi nanti."].join("\n");
  }

  if (!Array.isArray(items) || !items.length) {
    return ["ALERT HARI INI", "", "Tidak ada alert."].join("\n");
  }

  const limited = items.slice(0, 10);
  const lines = ["ALERT HARI INI", ""];

  limited.forEach((alert, idx) => {
    lines.push(`${idx + 1}. ${alert.nopol}`);
    lines.push(`Tipe: ${alert.title}`);
    if (alert.notification_created_at) {
      lines.push(`Waktu: ${alert.notification_created_at}`);
    }
    if (alert.customer_name) {
      lines.push(`Customer: ${alert.customer_name}`);
    }
    lines.push("");
  });

  return lines.join("\n").trim();
}

function formatUserActivatedMessage({ name, role }) {
  return ["AKUN ANDA TELAH DIAKTIFKAN", "", `Nama: ${name}`, `Role: ${role.toUpperCase()}`, "", "Ketik HELP untuk melihat daftar command."].join("\n");
}

module.exports = {
  formatHelp,
  formatDocumentStatus,
  formatTireStock,
  formatAlertSummary,
  formatDefaultReply,
  formatUserActivatedMessage,
};
