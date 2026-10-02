const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  MessageFlags 
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "previous",
  aliases: ['prev', 'back'],
  cooldown: "",
  category: "music",
  usage: "",
  description: "play previous song",
  args: false,
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

    if (!player.queue.previous || player.queue.previous.length === 0) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} No Previous Track`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No previously played song found\n` +
          `${blackEmoji.arrow} Play some music to build history`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    const previousTrack = player.queue.previous[player.queue.previous.length - 1];

    if (player.queue.previous) {
      player.queue.unshift(previousTrack);
      await player.skip();
    }
    
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.music} Playing Previous`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Track:** ${previousTrack.title.replace("[", "").replace("]", "")}\n` +
        `${blackEmoji.arrow} **Duration:** \`${previousTrack.isStream ? 'LIVE' : client.formatTime(previousTrack.length)}\`\n` +
        `${blackEmoji.arrow} **Requested by:** ${message.author}`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  },
};
