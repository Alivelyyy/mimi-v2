const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'hideall',
    aliases: ['hcall', 'hideallchannels'],
    cooldown: '',
    category: 'moderation',
    usage: '',
    description: 'Hide all channels',
    args: false,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['ManageChannels'], userPerms: ['ManageChannels'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message) => {
      let count = 0;
      for (const [, ch] of message.guild.channels.cache.filter(c => c.isTextBased())) {
        await ch.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: false }).catch(() => {});
        count++;
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Hidden **${count}** channels.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  