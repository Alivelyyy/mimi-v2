const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'say2',
    aliases: ['say3', 'botsay'],
    cooldown: '',
    category: 'joindm',
    usage: '<message>',
    description: 'Make the bot say something',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['ManageMessages'], userPerms: ['ManageMessages'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const text = args.join(' ');
      await message.delete().catch(() => {});
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
      return message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  