module.exports = {
  name: "HELP",
  permission: "HELP",
  pattern: /^HELP$/,
  async execute({ user, utils }) {
    return utils.formatHelp(user.role);
  },
};