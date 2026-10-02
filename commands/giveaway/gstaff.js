const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const Giveaway = require('@db/giveaway.js');

  module.exports = {
    name: 'gstaff',
    aliases: ['gstaffrole', 'gwstaff'],
    cooldown: '',
    category: 'giveaway',
    usage: '<role|reset> [@role]',
    description: 'Set or reset the giveaway staff role',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: ['ManageGuild'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const action = args[0]?.toLowerCase();
      if (action === 'role') {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await Giveaway.updateMany({ guildId: message.guild.id, ended: false }, { $set: { staffRoleId: role.id } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Giveaway staff role set to ${role}.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (action === 'reset') {
        await Giveaway.updateMany({ guildId: message.guild.id }, { $set: { staffRoleId: null } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Giveaway staff role has been **reset**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}gstaff <role|reset> [@role]\``));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  