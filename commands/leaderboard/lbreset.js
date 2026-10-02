const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const VoiceStats = require('@db/voiceStats.js');
const MessageStatsModel = require('@db/messageStats.js');
const InviteTracker = require('@db/inviteTracker.js');

module.exports = {
  name: 'lbreset',
  aliases: ['lbr', 'resetlb'],
  cooldown: '',
  category: 'leaderboard',
  usage: '<voice|message|invite|all> [daily|weekly|total|user @user]',
  description: 'Reset leaderboard data for this server',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const type = args[0]?.toLowerCase();
    const scope = args[1]?.toLowerCase();
    const validTypes = ['voice', 'message', 'invite', 'all'];

    if (!validTypes.includes(type)) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.info} **Usage:** \`${client.prefix}lbreset <voice|message|invite|all> [daily|weekly|total|user @user]\`\n\n` +
        `${blackEmoji.arrow} \`${client.prefix}lbreset voice daily\` — Reset daily voice stats\n` +
        `${blackEmoji.arrow} \`${client.prefix}lbreset message total\` — Reset all message stats\n` +
        `${blackEmoji.arrow} \`${client.prefix}lbreset all total\` — Reset everything\n` +
        `${blackEmoji.arrow} \`${client.prefix}lbreset voice user @user\` — Reset a user's voice stats`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const guildId = message.guild.id;
    const targetUser = message.mentions.users.first();
    let resetCount = 0;
    let resetLabel = '';

    if (scope === 'user' && !targetUser) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Please mention a user to reset. Example: \`${client.prefix}lbreset voice user @user\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (scope === 'user' && targetUser) {
      const filter = { guildId, userId: targetUser.id };
      if (type === 'voice' || type === 'all') {
        await VoiceStats.deleteMany(filter);
        resetCount++;
      }
      if (type === 'message' || type === 'all') {
        await MessageStatsModel.deleteMany(filter);
        resetCount++;
      }
      if (type === 'invite' || type === 'all') {
        await InviteTracker.deleteMany(filter);
        resetCount++;
      }
      resetLabel = `${type === 'all' ? 'all' : type} stats for ${targetUser.username}`;
    } else {
      const resetFields = {};
      if (scope === 'daily') {
        if (type === 'voice' || type === 'all') {
          await VoiceStats.updateMany({ guildId }, { $set: { dailyTime: 0 } });
          resetCount++;
        }
        if (type === 'message' || type === 'all') {
          await MessageStatsModel.updateMany({ guildId }, { $set: { dailyMessages: 0 } });
          resetCount++;
        }
        resetLabel = `daily ${type === 'all' ? 'voice + message' : type} stats`;
      } else if (scope === 'weekly') {
        if (type === 'voice' || type === 'all') {
          await VoiceStats.updateMany({ guildId }, { $set: { weeklyTime: 0 } });
          resetCount++;
        }
        if (type === 'message' || type === 'all') {
          await MessageStatsModel.updateMany({ guildId }, { $set: { weeklyMessages: 0 } });
          resetCount++;
        }
        resetLabel = `weekly ${type === 'all' ? 'voice + message' : type} stats`;
      } else {
        if (type === 'voice' || type === 'all') {
          await VoiceStats.deleteMany({ guildId });
          resetCount++;
        }
        if (type === 'message' || type === 'all') {
          await MessageStatsModel.deleteMany({ guildId });
          resetCount++;
        }
        if (type === 'invite' || type === 'all') {
          await InviteTracker.deleteMany({ guildId });
          resetCount++;
        }
        resetLabel = `all ${type === 'all' ? '' : type + ' '}leaderboard data`;
      }
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.yes} Successfully reset **${resetLabel}** for this server.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
