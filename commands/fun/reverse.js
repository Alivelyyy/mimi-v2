const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'reverse',
    aliases: ['rev', 'backwards'],
    cooldown: '',
    category: 'fun',
    usage: '<text>',
    description: 'Reverse text',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: [],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const reversed = args.join(' ').split('').reverse().join('');
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} ${reversed}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  