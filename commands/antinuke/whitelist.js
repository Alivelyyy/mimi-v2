const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const Antinuke = require('@db/antinuke.js');

  module.exports = {
    name: 'whitelist',
    aliases: ['wl', 'anwl2'],
    cooldown: '',
    category: 'antinuke',
    usage: '<@user>',
    description: 'Whitelist a user from anti-nuke',
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

      const doc = await Antinuke.findOne({ guildId: message.guild.id });
      if (doc?.whitelist?.includes(user.id)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} ${user.tag} is already whitelisted.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Antinuke.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { whitelist: user.id }, $set: { updatedAt: new Date() } }, { upsert: true });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} **${user.tag}** has been whitelisted.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  