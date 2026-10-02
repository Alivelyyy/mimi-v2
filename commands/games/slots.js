const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

const SYMBOLS = ['\ud83c\udf52', '\ud83c\udf4b', '\ud83c\udf4a', '\ud83c\udf47', '\ud83d\udc8e', '\u2b50', '\ud83d\udcb0', '\ud83c\udfb0'];
const WEIGHTS = [25, 20, 18, 15, 10, 7, 3, 2];

function weightedRandom() {
  const total = WEIGHTS.reduce((s, w) => s + w, 0);
  let rand = Math.floor(Math.random() * total);
  for (let i = 0; i < SYMBOLS.length; i++) {
    rand -= WEIGHTS[i];
    if (rand < 0) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

function spin() {
  return [
    [weightedRandom(), weightedRandom(), weightedRandom()],
    [weightedRandom(), weightedRandom(), weightedRandom()],
    [weightedRandom(), weightedRandom(), weightedRandom()],
  ];
}

function getResult(grid) {
  const mid = grid[1];
  if (mid[0] === mid[1] && mid[1] === mid[2]) {
    const idx = SYMBOLS.indexOf(mid[0]);
    if (idx <= 1) return { win: 'small', label: 'Small Win!', multi: 2 };
    if (idx <= 3) return { win: 'medium', label: 'Nice Win!', multi: 5 };
    if (idx <= 5) return { win: 'big', label: 'BIG WIN!', multi: 10 };
    return { win: 'jackpot', label: '\ud83c\udf89 JACKPOT!', multi: 50 };
  }
  if (mid[0] === mid[1] || mid[1] === mid[2]) {
    return { win: 'partial', label: 'Almost!', multi: 1 };
  }
  return { win: 'none', label: 'No luck', multi: 0 };
}

function renderGrid(grid) {
  const border = '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';
  return `\u250c${border}\u2510\n` +
    grid.map((row, i) => `\u2502 ${row.join(' \u2502 ')} \u2502${i === 1 ? ' \u25c0' : ''}`).join('\n') +
    `\n\u2514${border}\u2518`;
}

module.exports = {
  name: 'slots',
  aliases: ['slot', 'spin'],
  cooldown: '3',
  category: 'games',
  usage: '',
  description: 'Pull the slot machine lever! Match symbols to win',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message) => {
    let totalSpins = 0;
    let streak = 0;
    let bestResult = null;

    const doSpin = async (msg) => {
      totalSpins++;
      const loadC = new ContainerBuilder();
      loadC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# \ud83c\udfb0 Slot Machine\n${blackEmoji.loading} Spinning...`
      ));
      if (msg) await msg.edit({ components: [loadC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

      await new Promise(r => setTimeout(r, 800));

      const grid = spin();
      const result = getResult(grid);

      if (result.win !== 'none') streak++;
      else streak = 0;

      if (!bestResult || result.multi > bestResult.multi) bestResult = result;

      const emoji = result.win === 'jackpot' ? '\ud83c\udf89' : result.win === 'big' ? '\ud83c\udf1f' : result.win === 'none' ? blackEmoji.no : blackEmoji.yes;

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# \ud83c\udfb0 Slot Machine`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${renderGrid(grid)}\n\n` +
        `${emoji} **${result.label}**${result.multi > 1 ? ` (${result.multi}x)` : ''}\n` +
        `${blackEmoji.arrow} Spins: **${totalSpins}** | Streak: **${streak}** \ud83d\udd25\n` +
        `${blackEmoji.info} Best: **${bestResult.label}**`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('slots_spin').setLabel('\ud83c\udfb0 Spin Again').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('slots_stop').setLabel('Cash Out').setStyle(ButtonStyle.Danger),
      ));
      return c;
    };

    const initialCard = await doSpin(null);
    const gameMsg = await message.reply({ components: [initialCard], flags: MessageFlags.IsComponentsV2 });

    const collector = gameMsg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 2 * 60 * 1000,
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate().catch(() => {});

      if (interaction.customId === 'slots_stop') {
        collector.stop('cashout');
        const endC = new ContainerBuilder();
        endC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# \ud83c\udfb0 Slot Machine — Done!\n\n` +
          `${blackEmoji.arrow} **Total Spins:** ${totalSpins}\n` +
          `${blackEmoji.arrow} **Best Result:** ${bestResult?.label}\n` +
          `${blackEmoji.trophy} Thanks for playing, **${message.author.username}**!`
        ));
        return gameMsg.edit({ components: [endC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      const card = await doSpin(gameMsg);
      await gameMsg.edit({ components: [card], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        const timeC = new ContainerBuilder();
        timeC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# \ud83c\udfb0 Slot Machine — Timed Out\n${blackEmoji.arrow} Spins: **${totalSpins}** | Best: **${bestResult?.label}**`
        ));
        gameMsg.edit({ components: [timeC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });
  }
};
