const ROLE_PERMISSIONS = {
  viewer: ["HELP", "CEK_SURAT", "CEK_STOCK_BAN", "ALERT_HARI_INI"],
  operator: [
    "HELP",
    "CEK_SURAT",
    "CEK_STOCK_BAN",
    "ALERT_HARI_INI",
    "UPDATE_SURAT",
    "UPDATE_BAN",
  ],
  admin: [
    "HELP",
    "CEK_SURAT",
    "CEK_STOCK_BAN",
    "ALERT_HARI_INI",
    "UPDATE_SURAT",
    "UPDATE_BAN",
    "LIST_PENDING_USER",
    "APPROVE_USER",
    "REJECT_USER",
  ],
};

function canExecute(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

module.exports = {
  ROLE_PERMISSIONS,
  canExecute,
};