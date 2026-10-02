const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'howsimp',
    aliases: ['simp', 'simpmeter'],
    cooldown: '',
    category: 'fun',
    usage: '[@user]',
    description: 'How simp is someone?',
    args: false,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: [],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const user = message.mentions.users.first() || message.author;
      const pct = Math.floor(Math.random() * 101);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.heart} **${user.username}** is **${pct}%** simp`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  