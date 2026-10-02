const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'howsmart',
    aliases: ['smart', 'smartmeter'],
    cooldown: '',
    category: 'fun',
    usage: '[@user]',
    description: 'Check IQ level',
    args: false,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: [],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const user = message.mentions.users.first() || message.author;
      const iq = Math.floor(Math.random() * 200) + 1;
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **${user.username}** has an IQ of **${iq}**`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  