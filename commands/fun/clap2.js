const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'clap2',
    aliases: ['clapping', 'slowclap2'],
    cooldown: '',
    category: 'fun',
    usage: '<text>',
    description: 'Add clap emojis between words',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: [],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const clapped = args.join(' \u{1f44f} ');
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} ${clapped} \u{1f44f}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  