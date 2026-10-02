const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const Antinuke = require('@db/antinuke.js');

  module.exports = {
    name: 'whitelistreset',
    aliases: ['wlreset', 'anwlreset'],
    cooldown: '',
    category: 'antinuke',
    usage: '',
    description: 'Clear the entire antinuke whitelist',
    args: false,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['Administrator'], userPerms: ['Administrator'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message) => {
      if (message.guild.ownerId !== message.author.id) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Only the **server owner** can reset the whitelist.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Antinuke.findOneAndUpdate({ guildId: message.guild.id }, { $set: { whitelist: [], updatedAt: new Date() } });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} The whitelist has been **cleared**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  