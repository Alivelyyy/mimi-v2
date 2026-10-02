const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'bassboost',
  aliases: ['bb', 'bass'],
  cooldown: '5',
  category: 'filter',
  usage: '[low/medium/high/off]',
  description: 'Quick bassboost with intensity levels',
  args: false,
  vote: false, new: true, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: true, queue: true, inVoiceChannel: true, sameVoiceChannel: true,
  execute: async (client, message, args) => {
    const player = await client.getPlayer(message.guild.id);
    const level = (args[0]).toLowerCase();

    const presets = {
      low: [
        { band: 0, gain: 0.1 }, { band: 1, gain: 0.1 },
        { band: 2, gain: 0.05 }, { band: 3, gain: 0.05 },
      ],
      medium: [
        { band: 0, gain: 0.3 }, { band: 1, gain: 0.25 },
        { band: 2, gain: 0.15 }, { band: 3, gain: 0.1 },
        { band: 4, gain: 0.05 },
      ],
      high: [
        { band: 0, gain: 0.6 }, { band: 1, gain: 0.5 },
        { band: 2, gain: 0.35 }, { band: 3, gain: 0.25 },
        { band: 4, gain: 0.15 }, { band: 5, gain: 0.05 },
      ],
      off: [],
    };

    if (!presets[level]) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Invalid level. Use \`low\`, \`medium\`, \`high\`, or \`off\`.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const processingC = new ContainerBuilder();
    processingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.loading} Applying **${level === 'off' ? 'no' : level}** bass boost...`
    ));
    const msg = await message.reply({ components: [processingC], flags: MessageFlags.IsComponentsV2 });

    await player.shoukaku.setFilters({
      op: 'filters',
      guildId: message.guild.id,
      equalizer: presets[level],
    });

    setTimeout(async () => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Bass Boost`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        level === 'off'
          ? `${blackEmoji.yes} Bass boost **disabled**\n${blackEmoji.arrow} Equalizer reset to flat`
          : `${blackEmoji.yes} Bass boost set to **${level}**\n${blackEmoji.arrow} Intensity: ${blackEmoji.volUp.repeat(level === 'low' ? 1 : level === 'medium' ? 2 : 3)}\n${blackEmoji.info} Use \`${client.prefix}bassboost off\` to disable`
      ));
      await msg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }, 2000);
  }
};
