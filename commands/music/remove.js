const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  MessageFlags 
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "remove",
  aliases: ['rm', 'removesong'],
  cooldown: "",
  category: "music",
  usage: "<position in queue>",
  description: "remove song from queue",
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, prefix) => {
    const player = await client.getPlayer(message.guild.id);

    const position = Number(args[0]) - 1;
    const track = player.queue[position];

    if (position > player.queue.length || !track) {
      const number = position + 1;
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid Position`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No song at position **${number}**\n` +
          `${blackEmoji.arrow} **Queue length:** ${player.queue.length} tracks\n` +
          `${blackEmoji.arrow} Use \`${client.prefix}queue\` to view positions`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    await player.queue.splice(position, 1);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Track Removed`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Removed:** ${track.title.replace("[", "").replace("]", "")}\n` +
        `${blackEmoji.arrow} **Position:** #${position + 1}\n` +
        `${blackEmoji.arrow} **Removed by:** ${message.author}\n` +
        `${blackEmoji.arrow} **Remaining:** ${player.queue.length} tracks`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  },
};
