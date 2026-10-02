module.exports = {
  name: "messageCreate",
  run: async (client, message) => {
    if (message.author.bot) return;
  }
};
