const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'enlarge',
    aliases: ['emoji', 'bigemoji'],
    cooldown: '',
    category: 'moderation',
    usage: '<emoji>',
    description: 'Get a larger version of an emoji',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: [],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const emoji = args[0];
      const match = emoji.match(/<(a)?:(\w+):(\d+)>/);
      if (!match) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide a valid custom emoji.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const ext = match[1] ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/emojis/${match[3]}.${ext}?size=256`;
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} ${match[2]}\n\n[${emoji} Full Size](${url})`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  