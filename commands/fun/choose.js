const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'choose',
    aliases: ['pick', 'decide'],
    cooldown: '',
    category: 'fun',
    usage: '<option1 | option2 | ...>',
    description: 'Choose between options',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: [],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const options = args.join(' ').split('|').map(o => o.trim()).filter(o => o);
      if (options.length < 2) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} Separate options with \`|\`. Example: \`${client.prefix}choose cats | dogs\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const choice = options[Math.floor(Math.random() * options.length)];
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} I choose **${choice}**!`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  