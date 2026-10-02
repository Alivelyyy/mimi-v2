const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  MessageFlags 
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "volume",
  aliases: ['vol', 'v'],
  cooldown: "",
  category: "music",
  usage: "[ 1 - 500 ]",
  description: "set player volume",
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
    const currentVolume = player.volume;

    if (!args.length) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.music} Current Volume`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Volume:** ${currentVolume}%\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}volume <1-130>\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    let volume = Number(args[0]);
    volume = volume < 0 || volume > 130 ? NaN : volume;

    if (!volume) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid Volume`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Volume must be between **1** and **130**\n` +
          `${blackEmoji.arrow} **Current volume:** ${currentVolume}%`
        )
      );
      return await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    await player.setVolume(volume);
    await client.sleep(500);
    
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Volume Updated`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **New volume:** ${volume}%\n` +
        `${blackEmoji.arrow} **Previous volume:** ${currentVolume}%\n` +
        `${blackEmoji.arrow} **Set by:** ${message.author}`
      )
    );
    return await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  },
};
