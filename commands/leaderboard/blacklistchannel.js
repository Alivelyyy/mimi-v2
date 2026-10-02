const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const LbBlacklist = require('@db/lbBlacklist.js');

  module.exports = {
    name: 'blacklistchannel',
    aliases: ['blch', 'lbblock'],
    cooldown: '',
    category: 'leaderboard',
    usage: '<#channel>',
    description: 'Blacklist a channel from leaderboard tracking',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: ['ManageGuild'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
      if (!ch) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a channel.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await LbBlacklist.findOneAndUpdate({ guildId: message.guild.id, type: 'channel', targetId: ch.id }, {}, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${ch} is now **blacklisted** from leaderboard tracking.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  