const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

const DICE_FACES = ['\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];

module.exports = {
  name: 'dice',
  aliases: ['die', 'rolldice'],
  cooldown: '3',
  category: 'fun',
  usage: '[number of dice 1-6] [sides 2-100]',
  description: 'Roll one or more dice',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const count = Math.min(Math.max(parseInt(args[0]) || 1, 1), 6);
    const sides = Math.min(Math.max(parseInt(args[1]) || 6, 2), 100);

    const results = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = results.reduce((s, r) => s + r, 0);

    const diceDisplay = sides === 6
      ? results.map(r => DICE_FACES[r - 1]).join(' ')
      : results.map(r => `\`${r}\``).join(' + ');

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# \ud83c\udfb2 Dice Roll`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.arrow} Rolling **${count}d${sides}**...\n\n` +
      `## ${diceDisplay}\n\n` +
      (count > 1 ? `${blackEmoji.info} **Total:** ${total}\n` : '') +
      `*\`${client.prefix}dice [count] [sides]\` — e.g. \`${client.prefix}dice 3 20\`*`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('dice_again').setLabel('\ud83c\udfb2 Roll Again').setStyle(ButtonStyle.Secondary),
    ));

    const msg = await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 30000,
    });

    let lastDisplay = diceDisplay;
    let lastTotal = total;

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate().catch(() => {});
      const newResults = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const newTotal = newResults.reduce((s, r) => s + r, 0);
      const newDisplay = sides === 6
        ? newResults.map(r => DICE_FACES[r - 1]).join(' ')
        : newResults.map(r => `\`${r}\``).join(' + ');

      const nc = new ContainerBuilder();
      nc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# \ud83c\udfb2 Dice Roll`));
      nc.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      nc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Rolling **${count}d${sides}**...\n\n## ${newDisplay}\n\n` +
        (count > 1 ? `${blackEmoji.info} **Total:** ${newTotal}` : '')
      ));
      nc.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      nc.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('dice_again').setLabel('\ud83c\udfb2 Roll Again').setStyle(ButtonStyle.Secondary),
      ));
      lastDisplay = newDisplay;
      lastTotal = newTotal;
      await msg.edit({ components: [nc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector.on('end', () => {
      const endC = new ContainerBuilder();
      endC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# \ud83c\udfb2 Dice Roll\n${blackEmoji.arrow} ${lastDisplay}${count > 1 ? ` (Total: ${lastTotal})` : ''}`
      ));
      msg.edit({ components: [endC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  }
};
