const checkVote = require("@functions/checkVote.js");

module.exports = async (message, command, client = message.client) => {
  return await checkVote(client, message, message.author);
};
