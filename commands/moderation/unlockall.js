const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'unlockall',
    aliases: ['ula', 'unlockeverything'],
    cooldown: '',
    category: 'moderation',
    usage: '',
    description: 'Unlock all channels',
    args: false,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['ManageChannels'], userPerms: ['ManageChannels'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message) => {
      let count = 0;
      for (const [, ch] of message.guild.channels.cache.filter(c => c.isTextBased())) {
        await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true }).catch(() => {});
        count++;
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Unlocked **${count}** channels.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  