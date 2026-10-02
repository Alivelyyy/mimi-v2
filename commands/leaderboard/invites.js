const { MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const InviteTracker = require('@db/inviteTracker.js');
const { buildStatsCard, formatNumber, getUserInviteRank } = require('@utils/lbDisplay.js');

module.exports = {
  name: 'invites',
  aliases: ['invs', 'myinvites'],
  cooldown: '',
  category: 'leaderboard',
  usage: '[@user]',
  description: 'View detailed invite stats for a user',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const doc = await InviteTracker.findOne({ guildId: message.guild.id, userId: user.id });
    const rankData = await getUserInviteRank(InviteTracker, message.guild.id, user.id, 'totalInvites');

    const invitedByText = doc?.invitedBy ? `<@${doc.invitedBy}>` : 'Unknown';

    const card = buildStatsCard({
      title: `Invite Stats — ${user.username}`,
      icon: blackEmoji.link,
      fields: [
        { icon: blackEmoji.trophy, label: 'Total Invites', value: `${formatNumber(doc?.totalInvites || 0)} (Rank #${rankData.rank})` },
        { icon: blackEmoji.yes, label: 'Regular', value: formatNumber(doc?.regularInvites || 0) },
        { icon: blackEmoji.warn, label: 'Fake (Alt)', value: formatNumber(doc?.fakeInvites || 0) },
        { icon: blackEmoji.no, label: 'Left', value: formatNumber(doc?.leftInvites || 0) },
        { icon: blackEmoji.user, label: 'Invited By', value: invitedByText },
        { icon: blackEmoji.list, label: 'Total Invited', value: `${doc?.invitedUsers?.length || 0} members` }
      ]
    });

    return message.reply({ components: [card], flags: MessageFlags.IsComponentsV2 });
  }
};
