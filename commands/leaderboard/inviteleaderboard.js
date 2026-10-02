const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const InviteTracker = require('@db/inviteTracker.js');
const {
  buildLeaderboardPage,
  getInviteLeaderboardData,
  getUserInviteRank,
  formatNumber,
  setupLeaderboardCollector
} = require('@utils/lbDisplay.js');

module.exports = {
  name: 'inviteleaderboard',
  aliases: ['invlb', 'invitetop'],
  cooldown: '',
  category: 'leaderboard',
  usage: '[total|regular|fake|left]',
  description: 'View invite leaderboard with pagination',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const sortMap = { regular: 'regularInvites', fake: 'fakeInvites', left: 'leftInvites' };
    const labelMap = { totalInvites: 'Total', regularInvites: 'Regular', fakeInvites: 'Fake', leftInvites: 'Left' };
    let startSort = sortMap[args[0]?.toLowerCase()];

    async function render(state, disabled = false) {
      const sortKey = state.sortKey || startSort;
      const page = state.page || 1;
      const data = await getInviteLeaderboardData(InviteTracker, message.guild.id, sortKey, page);
      const userRankData = await getUserInviteRank(InviteTracker, message.guild.id, message.author.id, sortKey);

      const container = buildLeaderboardPage({
        entries: data.entries,
        page: data.page,
        totalPages: data.totalPages,
        title: `Invite Leaderboard — ${labelMap[sortKey]}`,
        icon: blackEmoji.link,
        period: 'total',
        type: 'invite',
        userId: message.author.id,
        userRank: userRankData.rank,
        userValue: userRankData.value,
        formatValue: (v) => `${formatNumber(v)} invites`
      });

      const sortRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('lb_invsort_totalInvites')
          .setLabel('Total')
          .setStyle(sortKey === 'totalInvites' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(sortKey === 'totalInvites'),
        new ButtonBuilder()
          .setCustomId('lb_invsort_regularInvites')
          .setLabel('Regular')
          .setStyle(sortKey === 'regularInvites' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(sortKey === 'regularInvites'),
        new ButtonBuilder()
          .setCustomId('lb_invsort_fakeInvites')
          .setLabel('Fake')
          .setStyle(sortKey === 'fakeInvites' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(sortKey === 'fakeInvites'),
        new ButtonBuilder()
          .setCustomId('lb_invsort_leftInvites')
          .setLabel('Left')
          .setStyle(sortKey === 'leftInvites' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(sortKey === 'leftInvites')
      );

      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('lb_prev_invite')
          .setEmoji(blackEmoji.previous).setLabel('Prev')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(data.page <= 1),
        new ButtonBuilder()
          .setCustomId('lb_next_invite')
          .setEmoji(blackEmoji.skip).setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(data.page >= data.totalPages)
      );

      if (disabled) {
        sortRow.components.forEach(b => b.setDisabled(true));
        navRow.components.forEach(b => b.setDisabled(true));
      }

      container.addActionRowComponents(sortRow);
      container.addActionRowComponents(navRow);
      return { components: [container], flags: MessageFlags.IsComponentsV2 };
    }

    const reply = await message.reply(await render({ page: 1, sortKey: startSort }));

    const collector = reply.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000
    });

    let state = { page: 1, sortKey: startSort };

    collector.on('collect', async (interaction) => {
      try {
        const id = interaction.customId;
        if (id.startsWith('lb_invsort_')) {
          state.sortKey = id.replace('lb_invsort_', '');
          state.page = 1;
        } else if (id === 'lb_prev_invite') {
          state.page = Math.max(1, state.page - 1);
        } else if (id === 'lb_next_invite') {
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
