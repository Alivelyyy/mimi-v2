const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const VoiceStats = require('@db/voiceStats.js');
const MessageStatsModel = require('@db/messageStats.js');
const InviteTracker = require('@db/inviteTracker.js');
const {
  buildLeaderboardPage,
  getVoiceLeaderboardData,
  getMessageLeaderboardData,
  getInviteLeaderboardData,
  getUserVoiceRank,
  getUserMessageRank,
  getUserInviteRank,
  formatVoiceTime,
  formatNumber
} = require('@utils/lbDisplay.js');

module.exports = {
  name: 'leaderboard',
  aliases: ['top', 'rankings'],
  cooldown: '',
  category: 'leaderboard',
  usage: '[voice|message|invite] [daily|weekly|total]',
  description: 'Unified leaderboard with voice, message and invite tabs',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    let startType = 'voice';
    let startPeriod = 'total';

    for (const arg of args.map(a => a.toLowerCase())) {
      if (['voice', 'vc', 'v'].includes(arg)) startType = 'voice';
      else if (['message', 'msg', 'messages', 'm'].includes(arg)) startType = 'message';
      else if (['invite', 'inv', 'invites', 'i'].includes(arg)) startType = 'invite';
      else if (['daily', 'today', 'd'].includes(arg)) startPeriod = 'daily';
      else if (['weekly', 'week', 'w'].includes(arg)) startPeriod = 'weekly';
      else if (['total', 'all', 'alltime', 'a'].includes(arg)) startPeriod = 'total';
    }

    async function render(state, disabled = false) {
      const type = state.type || startType;
      const period = state.period || startPeriod;
      const page = state.page || 1;

      let data, userRankData, title, icon, formatValue;

      if (type === 'voice') {
        data = await getVoiceLeaderboardData(VoiceStats, message.guild.id, period, page);
        userRankData = await getUserVoiceRank(VoiceStats, message.guild.id, message.author.id, period);
        title = 'Voice Leaderboard';
        icon = blackEmoji.mic;
        formatValue = formatVoiceTime;
      } else if (type === 'message') {
        data = await getMessageLeaderboardData(MessageStatsModel, message.guild.id, period, page);
        userRankData = await getUserMessageRank(MessageStatsModel, message.guild.id, message.author.id, period);
        title = 'Message Leaderboard';
        icon = blackEmoji.message;
        formatValue = (v) => `${formatNumber(v)} msgs`;
      } else {
        data = await getInviteLeaderboardData(InviteTracker, message.guild.id, 'totalInvites', page);
        userRankData = await getUserInviteRank(InviteTracker, message.guild.id, message.author.id, 'totalInvites');
        title = 'Invite Leaderboard';
        icon = blackEmoji.link;
        formatValue = (v) => `${formatNumber(v)} invites`;
      }

      const container = buildLeaderboardPage({
        entries: data.entries,
        page: data.page,
        totalPages: data.totalPages,
        title,
        icon,
        period: type === 'invite' ? 'total' : period,
        type,
        userId: message.author.id,
        userRank: userRankData.rank,
        userValue: userRankData.value,
        formatValue
      });

      const tabRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('lb_tab_voice')
          .setEmoji(blackEmoji.mic).setLabel('Voice')
          .setStyle(type === 'voice' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('lb_tab_message')
          .setEmoji(blackEmoji.message).setLabel('Messages')
          .setStyle(type === 'message' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('lb_tab_invite')
          .setEmoji(blackEmoji.link).setLabel('Invites')
          .setStyle(type === 'invite' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(disabled)
      );

      container.addActionRowComponents(tabRow);

      if (type !== 'invite') {
        const periodRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('lb_period_daily_unified')
            .setLabel('Today')
            .setStyle(period === 'daily' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(period === 'daily' || disabled),
          new ButtonBuilder()
            .setCustomId('lb_period_weekly_unified')
            .setLabel('This Week')
            .setStyle(period === 'weekly' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(period === 'weekly' || disabled),
          new ButtonBuilder()
            .setCustomId('lb_period_total_unified')
            .setLabel('All Time')
            .setStyle(period === 'total' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(period === 'total' || disabled),
          new ButtonBuilder()
            .setCustomId('lb_prev_unified')
            .setEmoji(blackEmoji.previous).setLabel('Prev')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(data.page <= 1 || disabled),
          new ButtonBuilder()
            .setCustomId('lb_next_unified')
            .setEmoji(blackEmoji.skip).setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(data.page >= data.totalPages || disabled)
        );
        container.addActionRowComponents(periodRow);
      } else {
        const navRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('lb_prev_unified')
            .setEmoji(blackEmoji.previous).setLabel('Prev')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(data.page <= 1 || disabled),
          new ButtonBuilder()
            .setCustomId('lb_next_unified')
            .setEmoji(blackEmoji.skip).setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(data.page >= data.totalPages || disabled)
        );
        container.addActionRowComponents(navRow);
      }

      return { components: [container], flags: MessageFlags.IsComponentsV2 };
    }

    let state = { page: 1, period: startPeriod, type: startType };
    const reply = await message.reply(await render(state));

    const collector = reply.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 90000
    });

    collector.on('collect', async (interaction) => {
      try {
        const id = interaction.customId;
        if (id.startsWith('lb_tab_')) {
          state.type = id.split('_')[2];
          state.page = 1;
        } else if (id.startsWith('lb_period_')) {
          const parts = id.split('_');
          state.period = parts[2];
          state.page = 1;
        } else if (id === 'lb_prev_unified') {
          state.page = Math.max(1, state.page - 1);
        } else if (id === 'lb_next_unified') {
          state.page += 1;
        }
        await interaction.update(await render(state));
      } catch (err) {
        try { await interaction.deferUpdate(); } catch (_) {}
      }
    });

    collector.on('end', async () => {
      try { await reply.edit(await render(state, true)); } catch (_) {}
    });
  }
};
