const { MessageFlags } = require("discord.js");

module.exports = async (message, client = message.client) => {
  let premiumUser = await client.db.premium.get(`${client.user.id}_${message.author.id}`);

  if (premiumUser && premiumUser !== true && Date.now() > premiumUser) {
    await client.db.premium.delete(`${client.user.id}_${message.author.id}`);
    await message.author
      .send({
        components: [
          new client.embed().desc(
            `**${client.emoji.warn} Your premium subscription has ended**\n` +
              `${client.emoji.bell} Please visit **[Support Server](${client.support})** or use \`${client.prefix}buy\` to renew`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => {});
    premiumUser = false;
  }

  return [premiumUser, premiumUser];
};
