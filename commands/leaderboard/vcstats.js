const { MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const VoiceStats = require('@db/voiceStats.js');
const { buildStatsCard, formatVoiceTime, getUserVoiceRank } = require('@utils/lbDisplay.js');

module.exports = {
  name: 'vcstats',
  aliases: ['vs', 'voicestats'],
  cooldown: '',
  category: 'leaderboard',
  usage: '[@user]',
  description: 'View detailed voice stats for a user',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const doc = await VoiceStats.findOne({ guildId: message.guild.id, userId: user.id });
    const rankTotal = await getUserVoiceRank(VoiceStats, message.guild.id, user.id, 'total');
    const rankDaily = await getUserVoiceRank(VoiceStats, message.guild.id, user.id, 'daily');
    const rankWeekly = await getUserVoiceRank(VoiceStats, message.guild.id, user.id, 'weekly');

    const isInVC = doc?.lastJoined ? true : false;
    const currentSession = isInVC ? Date.now() - doc.lastJoined.getTime() : 0;

    const card = buildStatsCard({
      title: `Voice Stats — ${user.username}`,
      icon: blackEmoji.mic,
      fields: [
        { icon: blackEmoji.trophy, label: 'All Time', value: `${formatVoiceTime((doc?.totalTime || 0) + currentSession)} (Rank #${rankTotal.rank})` },
        { icon: blackEmoji.time, label: 'Today', value: `${formatVoiceTime((doc?.dailyTime || 0) + currentSession)} (Rank #${rankDaily.rank})` },
        { icon: blackEmoji.stats, label: 'This Week', value: `${formatVoiceTime((doc?.weeklyTime || 0) + currentSession)} (Rank #${rankWeekly.rank})` },
        { icon: isInVC ? (blackEmoji.on) : (blackEmoji.off), label: 'Status', value: isInVC ? `In voice for ${formatVoiceTime(currentSession)}` : 'Not in voice' }
      ]
    });

    return message.reply({ components: [card], flags: MessageFlags.IsComponentsV2 });
  }
};
