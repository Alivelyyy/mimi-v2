const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const VoiceStats = require('@db/voiceStats.js');
const {
  buildLeaderboardPage,
  buildPeriodButtons,
  getVoiceLeaderboardData,
  getUserVoiceRank,
  formatVoiceTime,
  setupLeaderboardCollector
} = require('@utils/lbDisplay.js');

module.exports = {
  name: 'voiceleaderboard',
  aliases: ['vlb2', 'voicetop'],
  cooldown: '',
  category: 'leaderboard',
  usage: '[daily|weekly|total]',
  description: 'View voice time leaderboard with pagination',
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
      const data = await getVoiceLeaderboardData(VoiceStats, message.guild.id, period, page);
      const userRankData = await getUserVoiceRank(VoiceStats, message.guild.id, message.author.id, period);

      const container = buildLeaderboardPage({
        entries: data.entries,
        page: data.page,
        totalPages: data.totalPages,
        title: 'Voice Leaderboard',
        icon: blackEmoji.mic,
        period,
        type: 'voice',
        userId: message.author.id,
        userRank: userRankData.rank,
        userValue: userRankData.value,
        formatValue: formatVoiceTime
      });

      const { periodRow, navRow } = buildPeriodButtons(
        period, 'voice',
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
