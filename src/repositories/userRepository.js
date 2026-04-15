const fs = require("fs/promises");
const path = require("path");

const usersFile = path.join(process.cwd(), "data", "users.json");
const pendingUsersFile = path.join(process.cwd(), "data", "pendingUsers.json");

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

async function getUsers() {
  return readJson(usersFile, []);
}

async function getPendingUsers() {
  return readJson(pendingUsersFile, []);
}

async function findUserByJid(jid) {
  const users = await getUsers();
  return users.find((user) => user.jid === jid && user.isActive) || null;
}

async function findPendingByJid(jid) {
  const pendingUsers = await getPendingUsers();
  return pendingUsers.find((item) => item.jid === jid && item.status === "pending") || null;
}

async function findPendingByCode(code) {
  const pendingUsers = await getPendingUsers();
  return pendingUsers.find((item) => item.code === code && item.status === "pending") || null;
}

async function createPendingUser({ jid }) {
  const pendingUsers = await getPendingUsers();

  const existing = pendingUsers.find((item) => item.jid === jid && item.status === "pending");
  if (existing) return existing;

  const item = {
    code: generateRegistrationCode(),
    jid,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };

  pendingUsers.push(item);
  await writeJson(pendingUsersFile, pendingUsers);
  return item;
}

async function approvePendingUser({ code, role, approvedBy }) {
  const pendingUsers = await getPendingUsers();
  const users = await getUsers();

  const pendingIndex = pendingUsers.findIndex(
    (item) => item.code === code && item.status === "pending"
  );

  if (pendingIndex === -1) return null;

  const pending = pendingUsers[pendingIndex];

  const existingUserIndex = users.findIndex((user) => user.jid === pending.jid);

  const userRecord = {
    jid: pending.jid,
    name: pending.jid,
    role: role.toLowerCase(),
    isActive: true,
    createdAt: new Date().toISOString(),
    approvedBy,
  };

  if (existingUserIndex >= 0) {
    users[existingUserIndex] = {
      ...users[existingUserIndex],
      role: role.toLowerCase(),
      isActive: true,
      approvedBy,
    };
  } else {
    users.push(userRecord);
  }

  pendingUsers[pendingIndex] = {
    ...pending,
    status: "approved",
    approvedAt: new Date().toISOString(),
    approvedBy,
    role: role.toLowerCase(),
  };

  await writeJson(usersFile, users);
  await writeJson(pendingUsersFile, pendingUsers);

  return { pending, role: role.toLowerCase() };
}

async function rejectPendingUser({ code, rejectedBy }) {
  const pendingUsers = await getPendingUsers();

  const pendingIndex = pendingUsers.findIndex(
    (item) => item.code === code && item.status === "pending"
  );

  if (pendingIndex === -1) return null;

  const pending = pendingUsers[pendingIndex];
  pendingUsers[pendingIndex] = {
    ...pending,
    status: "rejected",
    rejectedAt: new Date().toISOString(),
    rejectedBy,
  };

  await writeJson(pendingUsersFile, pendingUsers);
  return pending;
}

function generateRegistrationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "REG-";
  for (let i = 0; i < 6; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  getUsers,
  getPendingUsers,
  findUserByJid,
  findPendingByJid,
  findPendingByCode,
  createPendingUser,
  approvePendingUser,
  rejectPendingUser,
};