const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'clearfilter',
  aliases: ['cf', 'nofilter'],
  cooldown: '5',
  category: 'filter',
  usage: '',
  description: 'Remove all active audio filters and reset to default',
  args: false,
  vote: false, new: true, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: true, queue: true, inVoiceChannel: true, sameVoiceChannel: true,
  execute: async (client, message) => {
    const player = await client.getPlayer(message.guild.id);

    const processingC = new ContainerBuilder();
    processingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.loading} Clearing all filters...`
    ));
    const msg = await message.reply({ components: [processingC], flags: MessageFlags.IsComponentsV2 });

    await player.shoukaku.setFilters({
      op: 'filters',
      guildId: message.guild.id,
      equalizer: [],
      timescale: { speed: 1.0, pitch: 1.0, rate: 1.0 },
      tremolo: null,
      vibrato: null,
      rotation: null,
      karaoke: null,
      distortion: null,
    });

    player.filters = [];

    setTimeout(async () => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Filters Cleared`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} All audio filters have been **removed**\n` +
        `${blackEmoji.arrow} Equalizer reset to flat\n` +
        `${blackEmoji.arrow} Speed, pitch, and effects reset to default\n` +
        `${blackEmoji.info} Use \`${client.prefix}filter\` to apply new filters`
      ));
      await msg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }, 2000);
  }
};
