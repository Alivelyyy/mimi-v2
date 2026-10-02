const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "replay",
  aliases: ['rpl', 'restartsong'],
  category: "music",
  description: "Replays the current song from the beginning",
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,

  execute: async (client, message, args, prefix) => {
    const player = await client.getPlayer(message.guild.id);

    await player.seek(0);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Replaying Track`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Replaying **${player.queue.current.title.substring(0, 50)}**\n` +
        `${blackEmoji.arrow} Action by: ${message.author}`
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    }).catch(() => {});
  },
};
