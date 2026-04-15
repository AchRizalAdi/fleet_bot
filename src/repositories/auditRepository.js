const fs = require("fs/promises");
const path = require("path");

const auditFile = path.join(process.cwd(), "data", "auditLogs.json");

async function readJson(file, fallback = []) {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function createLog({
  action,
  actorName,
  actorJid,
  actorRole,
  target = null,
  payload = null,
  status = "success",
  note = null,
}) {
  const logs = await readJson(auditFile, []);

  logs.push({
    id: `AUD-${Date.now()}`,
    action,
    actorName,
    actorJid,
    actorRole,
    target,
    payload,
    status,
    note,
    createdAt: new Date().toISOString(),
  });

  await writeJson(auditFile, logs);
}

async function getLogs(limit = 20) {
  const logs = await readJson(auditFile, []);
  return logs.slice(-limit).reverse();
}

module.exports = {
  createLog,
  getLogs,
};