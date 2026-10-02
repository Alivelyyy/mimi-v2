const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

const MEDALS = [blackEmoji.medal1, blackEmoji.medal2, blackEmoji.medal3];
const PER_PAGE = 10;

function formatVoiceTime(ms) {
  if (!ms || ms <= 0) return '0m';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function buildLeaderboardPage({ entries, page, totalPages, title, icon, period, type, userId, userRank, userValue, formatValue }) {
  const c = new ContainerBuilder();

  const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'All Time';
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `# ${icon} ${title} — ${periodLabel}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  if (!entries.length) {
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} No data recorded yet. Start ${type === 'voice' ? 'joining voice channels' : type === 'message' ? 'sending messages' : 'inviting members'}!`
    ));
  } else {
    const startIdx = (page - 1) * PER_PAGE;
    const lines = entries.map((entry, i) => {
      const rank = startIdx + i + 1;
      const medal = rank <= 3 ? MEDALS[rank - 1] : `**${rank}.**`;
      const highlight = entry.userId === userId ? ` ${blackEmoji.arrow}` : '';
      return `${medal} <@${entry.userId}> — ${formatValue(entry.value)}${highlight}`;
    });
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));
  }

  if (userRank && userRank > 0) {
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.user} **Your Rank:** #${userRank} — ${formatValue(userValue || 0)}`
    ));
  }

  if (totalPages > 0) {
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `-# Page ${page}/${totalPages}`
    ));
  }

  return c;
}

function buildPeriodButtons(currentPeriod, type, disablePrev, disableNext) {
  const periodRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lb_period_daily_${type}`)
      .setLabel('Today')
      .setStyle(currentPeriod === 'daily' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(currentPeriod === 'daily'),
    new ButtonBuilder()
      .setCustomId(`lb_period_weekly_${type}`)
      .setLabel('This Week')
      .setStyle(currentPeriod === 'weekly' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(currentPeriod === 'weekly'),
    new ButtonBuilder()
      .setCustomId(`lb_period_total_${type}`)
      .setLabel('All Time')
      .setStyle(currentPeriod === 'total' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(currentPeriod === 'total')
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lb_prev_${type}`)
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disablePrev),
    new ButtonBuilder()
      .setCustomId(`lb_next_${type}`)
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disableNext)
  );

  return { periodRow, navRow };
}

function buildStatsCard({ title, icon, fields }) {
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${icon} ${title}`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    fields.map(f => `${f.icon || blackEmoji.arrow} **${f.label}:** ${f.value}`).join('\n')
  ));
  return c;
}

async function getVoiceLeaderboardData(VoiceStats, guildId, period, page) {
  const sortField = period === 'daily' ? 'dailyTime' : period === 'weekly' ? 'weeklyTime' : 'totalTime';
  const totalDocs = await VoiceStats.countDocuments({ guildId, [sortField]: { $gt: 0 } });
  const totalPages = Math.max(1, Math.ceil(totalDocs / PER_PAGE));
  const clampedPage = Math.min(Math.max(1, page), totalPages);

  const docs = await VoiceStats.find({ guildId, [sortField]: { $gt: 0 } })
    .sort({ [sortField]: -1 })
    .skip((clampedPage - 1) * PER_PAGE)
    .limit(PER_PAGE);

  const entries = docs.map(d => ({ userId: d.userId, value: d[sortField] }));
  return { entries, totalPages, page: clampedPage };
}

async function getMessageLeaderboardData(MessageStats, guildId, period, page) {
  const sortField = period === 'daily' ? 'dailyMessages' : period === 'weekly' ? 'weeklyMessages' : 'totalMessages';
  const totalDocs = await MessageStats.countDocuments({ guildId, [sortField]: { $gt: 0 } });
  const totalPages = Math.max(1, Math.ceil(totalDocs / PER_PAGE));
  const clampedPage = Math.min(Math.max(1, page), totalPages);

  const docs = await MessageStats.find({ guildId, [sortField]: { $gt: 0 } })
    .sort({ [sortField]: -1 })
    .skip((clampedPage - 1) * PER_PAGE)
    .limit(PER_PAGE);

  const entries = docs.map(d => ({ userId: d.userId, value: d[sortField] }));
  return { entries, totalPages, page: clampedPage };
}

async function getInviteLeaderboardData(InviteTracker, guildId, sortKey, page) {
  const totalDocs = await InviteTracker.countDocuments({ guildId, [sortKey]: { $gt: 0 } });
  const totalPages = Math.max(1, Math.ceil(totalDocs / PER_PAGE));
  const clampedPage = Math.min(Math.max(1, page), totalPages);

  const docs = await InviteTracker.find({ guildId, [sortKey]: { $gt: 0 } })
    .sort({ [sortKey]: -1 })
    .skip((clampedPage - 1) * PER_PAGE)
    .limit(PER_PAGE);

  const entries = docs.map(d => ({ userId: d.userId, value: d[sortKey] }));
  return { entries, totalPages, page: clampedPage };
}

async function getUserVoiceRank(VoiceStats, guildId, userId, period) {
  const sortField = period === 'daily' ? 'dailyTime' : period === 'weekly' ? 'weeklyTime' : 'totalTime';
  const userDoc = await VoiceStats.findOne({ guildId, userId });
  if (!userDoc || !userDoc[sortField]) return { rank: 0, value: 0 };
  const rank = await VoiceStats.countDocuments({ guildId, [sortField]: { $gt: userDoc[sortField] } }) + 1;
  return { rank, value: userDoc[sortField] };
}

async function getUserMessageRank(MessageStats, guildId, userId, period) {
  const sortField = period === 'daily' ? 'dailyMessages' : period === 'weekly' ? 'weeklyMessages' : 'totalMessages';
  const userDoc = await MessageStats.findOne({ guildId, userId });
  if (!userDoc || !userDoc[sortField]) return { rank: 0, value: 0 };
  const rank = await MessageStats.countDocuments({ guildId, [sortField]: { $gt: userDoc[sortField] } }) + 1;
  return { rank, value: userDoc[sortField] };
}

async function getUserInviteRank(InviteTracker, guildId, userId, sortKey) {
  const userDoc = await InviteTracker.findOne({ guildId, userId });
  if (!userDoc || !userDoc[sortKey]) return { rank: 0, value: 0 };
  const rank = await InviteTracker.countDocuments({ guildId, [sortKey]: { $gt: userDoc[sortKey] } }) + 1;
  return { rank, value: userDoc[sortKey] };
}

function setupLeaderboardCollector(msg, authorId, renderFn, timeout = 60000) {
  const collector = msg.createMessageComponentCollector({
    filter: (i) => i.user.id === authorId,
    time: timeout
  });

  let state = { page: 1, period: 'total' };

  collector.on('collect', async (interaction) => {
    try {
      const id = interaction.customId;

      if (id.startsWith('lb_period_')) {
        const parts = id.split('_');
        state.period = parts[2];
        state.page = 1;
      } else if (id.startsWith('lb_prev_')) {
        state.page = Math.max(1, state.page - 1);
      } else if (id.startsWith('lb_next_')) {
        state.page += 1;
      } else if (id.startsWith('lb_tab_')) {
        state.type = id.split('_')[2];
        state.page = 1;
      }

      const result = await renderFn(state);
      await interaction.update(result);
    } catch (err) {
      try { await interaction.deferUpdate(); } catch (_) {}
    }
  });

  collector.on('end', async () => {
    try {
      const result = await renderFn(state, true);
      await msg.edit(result);
    } catch (_) {}
  });

  return { collector, state };
}

module.exports = {
  PER_PAGE,
  MEDALS,
  formatVoiceTime,
  formatNumber,
  buildLeaderboardPage,
  buildPeriodButtons,
  buildStatsCard,
  getVoiceLeaderboardData,
  getMessageLeaderboardData,
  getInviteLeaderboardData,
  getUserVoiceRank,
  getUserMessageRank,
  getUserInviteRank,
  setupLeaderboardCollector
};
