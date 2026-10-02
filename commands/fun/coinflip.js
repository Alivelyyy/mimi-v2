const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'coinflip',
  aliases: ['flip', 'toss'],
  cooldown: '3',
  category: 'fun',
  usage: '[heads/tails]',
  description: 'Flip a coin — optionally call heads or tails',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const call = args[0]?.toLowerCase();
    const validCall = ['heads', 'h', 'tails', 't'].includes(call);
    const normalizedCall = validCall ? (['heads', 'h'].includes(call) ? 'Heads' : 'Tails') : null;

    const flipC = new ContainerBuilder();
    flipC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `# \ud83e\ude99 Coin Flip\n${blackEmoji.loading} Flipping...`
    ));
    const msg = await message.reply({ components: [flipC], flags: MessageFlags.IsComponentsV2 });

    await new Promise(r => setTimeout(r, 800));

    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const emoji = result === 'Heads' ? '\ud83e\udee8' : '\ud83e\udee7';
    const won = normalizedCall ? normalizedCall === result : null;

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# \ud83e\ude99 Coin Flip`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    let resultText = `${emoji} The coin landed on **${result}**!`;
    if (won === true) resultText += `\n${blackEmoji.yes} You called **${normalizedCall}** — you win!`;
    else if (won === false) resultText += `\n${blackEmoji.no} You called **${normalizedCall}** — you lose!`;
    resultText += `\n\n${blackEmoji.info} *Tip: \`${client.prefix}coinflip heads\` to call it*`;

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(resultText));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('cf_again').setLabel('\ud83e\ude99 Flip Again').setStyle(ButtonStyle.Secondary),
    ));
    await msg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 30000,
    });

    let lastResult = result;
    let lastEmoji = emoji;

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate().catch(() => {});
      const newResult = Math.random() < 0.5 ? 'Heads' : 'Tails';
      const newEmoji = newResult === 'Heads' ? '\ud83e\udee8' : '\ud83e\udee7';
      lastResult = newResult;
      lastEmoji = newEmoji;
      const nc = new ContainerBuilder();
      nc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# \ud83e\ude99 Coin Flip`));
      nc.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      nc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${newEmoji} The coin landed on **${newResult}**!`));
      nc.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      nc.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cf_again').setLabel('\ud83e\ude99 Flip Again').setStyle(ButtonStyle.Secondary),
      ));
      await msg.edit({ components: [nc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector.on('end', () => {
      const endC = new ContainerBuilder();
      endC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# \ud83e\ude99 Coin Flip\n${lastEmoji} The coin landed on **${lastResult}**!`));
      msg.edit({ components: [endC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  }
};
