const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "svlist",
  aliases: ['servers', 'guilds'],
  cooldown: "",
  category: "owner",
  usage: "",
  description: "Shows the list of servers the bot is in",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: true,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const guilds = client.guilds.cache
      .sort((a, b) => b.memberCount - a.memberCount)
      .map((guild, index) => {
        return `${blackEmoji.arrow} **${guild.name}** (\`${guild.id}\`)\n` +
               `   ${blackEmoji.user} \`${guild.memberCount}\` members`;
      });

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.server} Server List`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.stats} **Total Servers:** \`${client.guilds.cache.size}\`\n` +
        `${blackEmoji.user} **Total Users:** \`${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}\``
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(guilds.slice(0, 10).join('\n\n'))
    );

    if (guilds.length > 10) {
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Showing 10 of ${guilds.length} servers*`)
      );
    }

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
