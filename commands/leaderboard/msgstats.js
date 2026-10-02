const { MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const MessageStatsModel = require('@db/messageStats.js');
const { buildStatsCard, formatNumber, getUserMessageRank } = require('@utils/lbDisplay.js');

module.exports = {
  name: 'msgstats',
  aliases: ['ms2', 'messagestats'],
  cooldown: '',
  category: 'leaderboard',
  usage: '[@user]',
  description: 'View detailed message stats for a user',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const doc = await MessageStatsModel.findOne({ guildId: message.guild.id, userId: user.id });
    const rankTotal = await getUserMessageRank(MessageStatsModel, message.guild.id, user.id, 'total');
    const rankDaily = await getUserMessageRank(MessageStatsModel, message.guild.id, user.id, 'daily');
    const rankWeekly = await getUserMessageRank(MessageStatsModel, message.guild.id, user.id, 'weekly');

    const card = buildStatsCard({
      title: `Message Stats — ${user.username}`,
      icon: blackEmoji.message,
      fields: [
        { icon: blackEmoji.trophy, label: 'All Time', value: `${formatNumber(doc?.totalMessages || 0)} msgs (Rank #${rankTotal.rank})` },
        { icon: blackEmoji.time, label: 'Today', value: `${formatNumber(doc?.dailyMessages || 0)} msgs (Rank #${rankDaily.rank})` },
        { icon: blackEmoji.stats, label: 'This Week', value: `${formatNumber(doc?.weeklyMessages || 0)} msgs (Rank #${rankWeekly.rank})` }
      ]
    });

    return message.reply({ components: [card], flags: MessageFlags.IsComponentsV2 });
  }
};
