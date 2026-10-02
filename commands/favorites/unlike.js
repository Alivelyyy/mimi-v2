const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const favorites = require("@db/favorites.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "unlike",
  aliases: ['unfav', 'dislike'],
  category: "favorites",
  description: "Remove a song from your favorites by position number",
  usage: "<number>",
  args: true,
  cooldown: "3",
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,

  execute: async (client, message, args, emoji) => {
    const userFavorites = await favorites.get(`${message.author.id}`);

    if (!userFavorites?.length) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} You don't have any favorites to remove.`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    if (args[0]?.toLowerCase() === 'all') {
      await favorites.delete(`${message.author.id}`);
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.yes} All **${userFavorites.length}** favorite(s) removed.`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const parsed = Number(args[0]);
    const index = (Number.isInteger(parsed) ? parsed : NaN) - 1;

    if (isNaN(index) || index < 0 || index >= userFavorites.length) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.no} Invalid number. Use a number between **1** and **${userFavorites.length}**.\n` +
          `${blackEmoji.info} Use \`${client.prefix}showliked\` to see your favorites with numbers.\n` +
          `${blackEmoji.info} Use \`${client.prefix}unlike all\` to remove everything.`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const removed = userFavorites.splice(index, 1)[0];
    await favorites.set(`${message.author.id}`, userFavorites);

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Removed from Favorites`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.music} **Song:** [${removed.title}](${removed.uri})\n` +
        `${blackEmoji.user} **Artist:** ${removed.author}\n` +
        `${blackEmoji.list} **Remaining:** ${userFavorites.length} favorite(s)`
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  },
};
