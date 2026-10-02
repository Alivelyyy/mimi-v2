const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

const EMPTY = '\u2B1C';
const X_MARK = '\u274C';
const O_MARK = '\u2B55';

const WIN_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function checkWin(board, mark) {
  return WIN_COMBOS.some(combo => combo.every(i => board[i] === mark));
}

function checkDraw(board) {
  return board.every(cell => cell !== null);
}

function buildBoard(board, disabled = false) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = board[idx];
      const btn = new ButtonBuilder()
        .setCustomId(`ttt_${idx}`)
        .setStyle(cell === 'X' ? ButtonStyle.Danger : cell === 'O' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setLabel(cell === 'X' ? 'X' : cell === 'O' ? 'O' : '\u200b')
        .setDisabled(disabled || cell !== null);
      row.addComponents(btn);
    }
    rows.push(row);
  }
  return rows;
}

function renderBoard(board) {
  return board.map(cell => cell === 'X' ? X_MARK : cell === 'O' ? O_MARK : EMPTY)
    .reduce((rows, cell, i) => {
      if (i % 3 === 0) rows.push([]);
      rows[rows.length - 1].push(cell);
      return rows;
    }, [])
    .map(row => row.join(' ')).join('\n');
}

module.exports = {
  name: 'tictactoe',
  aliases: ['ttt', 'tic'],
  cooldown: '5',
  category: 'fun',
  usage: '[@user]',
  description: 'Play Tic Tac Toe against another player or the bot',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const opponent = message.mentions.users.first();
    if (opponent && (opponent.bot || opponent.id === message.author.id)) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You can't play against that user. Mention someone else or play solo vs the bot.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const vsBot = !opponent;
    const players = { X: message.author, O: vsBot ? client.user : opponent };
    const board = Array(9).fill(null);
    let turn = 'X';
    let ended = false;

    const buildCard = (status) => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Tic Tac Toe`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${X_MARK} **${players.X.username}** vs ${O_MARK} **${players.O.username}**\n\n${renderBoard(board)}\n\n${status}`
      ));
      return c;
    };

    if (!vsBot && opponent) {
      const inviteC = new ContainerBuilder();
      inviteC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.info} Tic Tac Toe\n\n${blackEmoji.arrow} ${opponent}, **${message.author.username}** challenges you!\n${blackEmoji.time} You have **30 seconds** to accept.`
      ));
      inviteC.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      inviteC.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ttt_accept').setLabel('Accept').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('ttt_decline').setLabel('Decline').setStyle(ButtonStyle.Danger),
      ));
      const inviteMsg = await message.reply({ components: [inviteC], flags: MessageFlags.IsComponentsV2 });

      const acceptCollector = inviteMsg.createMessageComponentCollector({ filter: i => i.user.id === opponent.id, time: 30000, max: 1 });
      const accepted = await new Promise(resolve => {
        acceptCollector.on('collect', async i => {
          await i.deferUpdate().catch(() => {});
          resolve(i.customId === 'ttt_accept');
        });
        acceptCollector.on('end', collected => { if (collected.size === 0) resolve(false); });
      });

      if (!accepted) {
        const decC = new ContainerBuilder();
        decC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} ${opponent.username} declined the challenge or didn't respond.`));
        return inviteMsg.edit({ components: [decC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
      await inviteMsg.delete().catch(() => {});
    }

    const card = buildCard(`${blackEmoji.arrow} **${players[turn].username}**'s turn (${turn === 'X' ? X_MARK : O_MARK})`);
    const rows = buildBoard(board);
    rows.forEach(r => card.addActionRowComponents(r));
    const gameMsg = await message.channel.send({ components: [card], flags: MessageFlags.IsComponentsV2 });

    function botMove() {
      for (const combo of WIN_COMBOS) {
        const vals = combo.map(i => board[i]);
        if (vals.filter(v => v === 'O').length === 2 && vals.includes(null)) return combo[vals.indexOf(null)];
      }
      for (const combo of WIN_COMBOS) {
        const vals = combo.map(i => board[i]);
        if (vals.filter(v => v === 'X').length === 2 && vals.includes(null)) return combo[vals.indexOf(null)];
      }
      if (board[4] === null) return 4;
      const corners = [0, 2, 6, 8].filter(i => board[i] === null);
      if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
      const empty = board.reduce((acc, v, i) => v === null ? [...acc, i] : acc, []);
      return empty[Math.floor(Math.random() * empty.length)];
    }

    const collector = gameMsg.createMessageComponentCollector({ time: 2 * 60 * 1000 });

    collector.on('collect', async (interaction) => {
      if (ended) return;
      const currentPlayer = players[turn];
      if (interaction.user.id !== currentPlayer.id) {
        return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.no} It's not your turn!`)
        )], flags: MessageFlags.IsComponentsV2 | 64 }).catch(() => {});
      }
      await interaction.deferUpdate().catch(() => {});

      const idx = parseInt(interaction.customId.split('_')[1]);
      if (board[idx] !== null) return;
      board[idx] = turn;

      if (checkWin(board, turn)) {
        ended = true;
        collector.stop();
        const winCard = buildCard(`${blackEmoji.trophy} **${players[turn].username}** wins!`);
        buildBoard(board, true).forEach(r => winCard.addActionRowComponents(r));
        return gameMsg.edit({ components: [winCard], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
      if (checkDraw(board)) {
        ended = true;
        collector.stop();
        const drawCard = buildCard(`${blackEmoji.info} It's a **draw**!`);
        buildBoard(board, true).forEach(r => drawCard.addActionRowComponents(r));
        return gameMsg.edit({ components: [drawCard], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      turn = turn === 'X' ? 'O' : 'X';

      if (vsBot && turn === 'O') {
        const botIdx = botMove();
        board[botIdx] = 'O';

        if (checkWin(board, 'O')) {
          ended = true;
          collector.stop();
          const winCard = buildCard(`${blackEmoji.no} **${client.user.username}** wins! Better luck next time.`);
          buildBoard(board, true).forEach(r => winCard.addActionRowComponents(r));
          return gameMsg.edit({ components: [winCard], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
        if (checkDraw(board)) {
          ended = true;
          collector.stop();
          const drawCard = buildCard(`${blackEmoji.info} It's a **draw**!`);
          buildBoard(board, true).forEach(r => drawCard.addActionRowComponents(r));
          return gameMsg.edit({ components: [drawCard], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
        turn = 'X';
      }

      const updatedCard = buildCard(`${blackEmoji.arrow} **${players[turn].username}**'s turn (${turn === 'X' ? X_MARK : O_MARK})`);
      buildBoard(board).forEach(r => updatedCard.addActionRowComponents(r));
      await gameMsg.edit({ components: [updatedCard], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector.on('end', (_, reason) => {
      if (!ended) {
        ended = true;
        const timeoutCard = buildCard(`${blackEmoji.info} Game timed out.`);
        buildBoard(board, true).forEach(r => timeoutCard.addActionRowComponents(r));
        gameMsg.edit({ components: [timeoutCard], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });
  }
};
