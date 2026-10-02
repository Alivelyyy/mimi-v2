const { MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const MessageStats = require('@db/messageStats.js');
const {
  buildLeaderboardPage,
  buildPeriodButtons,
  getMessageLeaderboardData,
  getUserMessageRank,
  formatNumber,
  setupLeaderboardCollector
} = require('@utils/lbDisplay.js');

module.exports = {
  name: 'messageleaderboard',
  aliases: ['mlb', 'msgtop'],
  cooldown: '',
  category: 'leaderboard',
  usage: '[daily|weekly|total]',
  description: 'View message leaderboard with pagination',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const periodArg = args[0]?.toLowerCase();
    let startPeriod = 'total';
    if (['daily', 'today', 'd'].includes(periodArg)) startPeriod = 'daily';
    else if (['weekly', 'week', 'w'].includes(periodArg)) startPeriod = 'weekly';

    async function render(state, disabled = false) {
      const period = state.period || startPeriod;
      const page = state.page || 1;
      const data = await getMessageLeaderboardData(MessageStats, message.guild.id, period, page);
      const userRankData = await getUserMessageRank(MessageStats, message.guild.id, message.author.id, period);

      const container = buildLeaderboardPage({
        entries: data.entries,
        page: data.page,
        totalPages: data.totalPages,
        title: 'Message Leaderboard',
        icon: blackEmoji.message,
        period,
        type: 'message',
        userId: message.author.id,
        userRank: userRankData.rank,
        userValue: userRankData.value,
        formatValue: (v) => `${formatNumber(v)} msgs`
      });

      const { periodRow, navRow } = buildPeriodButtons(
        period, 'message',
        data.page <= 1,
        data.page >= data.totalPages
      );

      if (disabled) {
        periodRow.components.forEach(b => b.setDisabled(true));
        navRow.components.forEach(b => b.setDisabled(true));
      }

      container.addActionRowComponents(periodRow);
      container.addActionRowComponents(navRow);
      return { components: [container], flags: MessageFlags.IsComponentsV2 };
    }

    const initialState = { page: 1, period: startPeriod };
    const reply = await message.reply(await render(initialState));

    const { state } = setupLeaderboardCollector(reply, message.author.id, render);
    state.period = startPeriod;
  }
};
