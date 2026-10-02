const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const Antinuke = require('@db/antinuke.js');

  module.exports = {
    name: 'unwhitelist',
    aliases: ['unwl', 'anuwl'],
    cooldown: '',
    category: 'antinuke',
    usage: '<@user>',
    description: 'Remove a user from anti-nuke whitelist',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['Administrator'], userPerms: ['Administrator'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      if (message.guild.ownerId !== message.author.id) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Only the **server owner** can manage whitelist.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
      if (!user) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid user.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Antinuke.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { whitelist: user.id }, $set: { updatedAt: new Date() } });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} **${user.tag}** has been removed from whitelist.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  