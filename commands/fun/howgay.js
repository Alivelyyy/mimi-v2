const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'howgay',
    aliases: ['gay', 'gaymeter'],
    cooldown: '',
    category: 'fun',
    usage: '[@user]',
    description: 'How gay is someone?',
    args: false,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: [],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const user = message.mentions.users.first() || message.author;
      const pct = Math.floor(Math.random() * 101);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **${user.username}** is **${pct}%** gay \u{1f308}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  