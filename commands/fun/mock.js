const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'mock',
    aliases: ['spongemock', 'mocking'],
    cooldown: '',
    category: 'fun',
    usage: '<text>',
    description: 'Mock text (sPoNgEbOb)',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: [],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const mocked = args.join(' ').split('').map((ch, i) => i % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase()).join('');
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} ${mocked}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  