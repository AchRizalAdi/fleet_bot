module.exports = {
  name: "LIST_PENDING_USER",
  permission: "LIST_PENDING_USER",
  pattern: /^LIST PENDING USER$/,
  async execute({ repositories }) {
    const pendingUsers = await repositories.userRepository.getPendingUsers();
    const activePending = pendingUsers.filter((item) => item.status === "pending");

    if (activePending.length === 0) {
      return "Tidak ada user pending.";
    }

    return [
      "PENDING USER:",
      ...activePending.map((item, index) => `${index + 1}. ${item.code} - ${item.jid}`),
    ].join("\n");
  },
};