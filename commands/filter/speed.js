const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'speed',
  aliases: ['sp', 'playbackspeed'],
  cooldown: '5',
  category: 'filter',
  usage: '<0.5-2.0>',
  description: 'Change playback speed (0.5x to 2.0x)',
  args: true,
  vote: false, new: true, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: true, queue: true, inVoiceChannel: true, sameVoiceChannel: true,
  execute: async (client, message, args) => {
    const player = await client.getPlayer(message.guild.id);
    const speed = parseFloat(args[0]);

    if (isNaN(speed) || speed < 0.5 || speed > 2.0) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Speed must be between **0.5** and **2.0**\n${blackEmoji.info} Example: \`${client.prefix}speed 1.5\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const processingC = new ContainerBuilder();
    processingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.loading} Setting playback speed to **${speed}x**...`
    ));
    const msg = await message.reply({ components: [processingC], flags: MessageFlags.IsComponentsV2 });

    await player.shoukaku.setFilters({
      op: 'filters',
      guildId: message.guild.id,
      timescale: { speed: speed, pitch: 1.0, rate: 1.0 },
    });

    setTimeout(async () => {
      const speedIcon = speed > 1.0 ? blackEmoji.fast : speed < 1.0 ? blackEmoji.rewind : blackEmoji.play;
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${speedIcon} Playback Speed`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Speed set to **${speed}x**\n` +
        `${blackEmoji.info} Use \`${client.prefix}speed 1.0\` to reset to normal`
      ));
      await msg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }, 2000);
  }
};
