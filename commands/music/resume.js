const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  MessageFlags 
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "resume",
  aliases: ['res', 'continue'],
  cooldown: "",
  category: "music",
  usage: "",
  description: "resume the player",
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

    if (!player.shoukaku.paused) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Not Paused`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} The player is not paused\n` +
          `${blackEmoji.arrow} Use \`${client.prefix}pause\` to pause playback`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    await player.pause(false);
    await updateEmbed(client, player);

    const track = player.queue.current;
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Player Resumed`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Track:** ${track?.title}\n` +
        `${blackEmoji.arrow} **Duration:** \`${track?.isStream ? 'LIVE' : client.formatTime(player.position)}/${track?.isStream ? 'LIVE' : client.formatTime(track?.length)}\`\n` +
        `${blackEmoji.arrow} **Resumed by:** ${message.author}`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  },
};
