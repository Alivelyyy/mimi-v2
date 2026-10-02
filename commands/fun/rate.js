const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'rate',
    aliases: ['rating', 'rater'],
    cooldown: '',
    category: 'fun',
    usage: '[@user]',
    description: 'Rate pp size',
    args: false,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: [],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const user = message.mentions.users.first() || message.author;
      const size = Math.floor(Math.random() * 12) + 1;
      const pp = '8' + '='.repeat(size) + 'D';
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **${user.username}**\n${pp}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  