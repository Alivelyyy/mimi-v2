const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

const ROWS = 6;
const COLS = 7;
const EMPTY = '\u26AB';
const RED = '\ud83d\udd34';
const YELLOW = '\ud83d\udfe1';
const COL_NUMS = ['1\ufe0f\u20e3','2\ufe0f\u20e3','3\ufe0f\u20e3','4\ufe0f\u20e3','5\ufe0f\u20e3','6\ufe0f\u20e3','7\ufe0f\u20e3'];

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function dropPiece(board, col, player) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      board[r][col] = player;
      return r;
    }
  }
  return -1;
}

function checkWin(board, player) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== player) continue;
      if (c + 3 < COLS && board[r][c+1] === player && board[r][c+2] === player && board[r][c+3] === player) return true;
      if (r + 3 < ROWS && board[r+1][c] === player && board[r+2][c] === player && board[r+3][c] === player) return true;
      if (r + 3 < ROWS && c + 3 < COLS && board[r+1][c+1] === player && board[r+2][c+2] === player && board[r+3][c+3] === player) return true;
      if (r + 3 < ROWS && c - 3 >= 0 && board[r+1][c-1] === player && board[r+2][c-2] === player && board[r+3][c-3] === player) return true;
    }
  }
  return false;
}

function isFull(board) {
  return board[0].every(cell => cell !== null);
}

function renderBoard(board) {
  const header = COL_NUMS.join('');
  const rows = board.map(row => row.map(cell => cell === 1 ? RED : cell === 2 ? YELLOW : EMPTY).join('')).join('\n');
  return `${header}\n${rows}`;
}

function buildButtons(board, disabled = false) {
  const row1 = new ActionRowBuilder();
  const row2 = new ActionRowBuilder();
  for (let c = 0; c < 4; c++) {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`c4_${c}`)
        .setLabel(`${c + 1}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || board[0][c] !== null)
    );
  }
  for (let c = 4; c < COLS; c++) {
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId(`c4_${c}`)
        .setLabel(`${c + 1}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || board[0][c] !== null)
    );
  }
  return [row1, row2];
}

module.exports = {
  name: 'connect4',
  aliases: ['c4', 'four'],
  cooldown: '5',
  category: 'games',
  usage: '<@user>',
  description: 'Play Connect 4 against another player',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const opponent = message.mentions.users.first();
    if (!opponent || opponent.bot || opponent.id === message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}connect4 @user\``));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const players = { 1: message.author, 2: opponent };
    const board = createBoard();
    let turn = 1;
    let ended = false;

    const inviteC = new ContainerBuilder();
    inviteC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `# ${blackEmoji.info} Connect 4\n\n${blackEmoji.arrow} ${opponent}, **${message.author.username}** challenges you!\n${blackEmoji.time} **30 seconds** to accept.`
    ));
    inviteC.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    inviteC.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('c4_accept').setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('c4_decline').setLabel('Decline').setStyle(ButtonStyle.Danger),
    ));
    const inviteMsg = await message.reply({ components: [inviteC], flags: MessageFlags.IsComponentsV2 });

    const acceptCollector = inviteMsg.createMessageComponentCollector({ filter: i => i.user.id === opponent.id, time: 30000, max: 1 });
    const accepted = await new Promise(resolve => {
      acceptCollector.on('collect', async i => { await i.deferUpdate().catch(() => {}); resolve(i.customId === 'c4_accept'); });
      acceptCollector.on('end', collected => { if (collected.size === 0) resolve(false); });
    });

    if (!accepted) {
      const decC = new ContainerBuilder();
      decC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} ${opponent.username} declined or didn't respond.`));
      return inviteMsg.edit({ components: [decC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
    await inviteMsg.delete().catch(() => {});

    const buildCard = (status) => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Connect 4`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${RED} **${players[1].username}** vs ${YELLOW} **${players[2].username}**\n\n${renderBoard(board)}\n\n${status}`
      ));
      return c;
    };

    const card = buildCard(`${blackEmoji.arrow} **${players[turn].username}**'s turn (${turn === 1 ? RED : YELLOW})`);
    buildButtons(board).forEach(r => card.addActionRowComponents(r));
    const gameMsg = await message.channel.send({ components: [card], flags: MessageFlags.IsComponentsV2 });

    const collector = gameMsg.createMessageComponentCollector({ time: 5 * 60 * 1000 });

    collector.on('collect', async (interaction) => {
      if (ended) return;
      if (interaction.user.id !== players[turn].id) {
        return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.no} It's not your turn!`)
        )], flags: MessageFlags.IsComponentsV2 | 64 }).catch(() => {});
      }
      await interaction.deferUpdate().catch(() => {});

      const col = parseInt(interaction.customId.split('_')[1]);
      const row = dropPiece(board, col, turn);
      if (row === -1) return;

      if (checkWin(board, turn)) {
        ended = true;
        collector.stop();
        const winCard = buildCard(`${blackEmoji.trophy} **${players[turn].username}** wins!`);
        buildButtons(board, true).forEach(r => winCard.addActionRowComponents(r));
        return gameMsg.edit({ components: [winCard], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
      if (isFull(board)) {
        ended = true;
        collector.stop();
        const drawCard = buildCard(`${blackEmoji.info} It's a **draw**!`);
        buildButtons(board, true).forEach(r => drawCard.addActionRowComponents(r));
        return gameMsg.edit({ components: [drawCard], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      turn = turn === 1 ? 2 : 1;
      const updatedCard = buildCard(`${blackEmoji.arrow} **${players[turn].username}**'s turn (${turn === 1 ? RED : YELLOW})`);
      buildButtons(board).forEach(r => updatedCard.addActionRowComponents(r));
      await gameMsg.edit({ components: [updatedCard], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector.on('end', () => {
      if (!ended) {
        ended = true;
        const timeoutCard = buildCard(`${blackEmoji.info} Game timed out.`);
        buildButtons(board, true).forEach(r => timeoutCard.addActionRowComponents(r));
        gameMsg.edit({ components: [timeoutCard], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });
  }
};
