const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const MainRole = require('@db/mainrole.js');

  module.exports = {
    name: 'mainrole',
    aliases: ['mr', 'mrole'],
    cooldown: '',
    category: 'antinuke',
    usage: '<add|remove|list|reset> [role]',
    description: 'Manage protected main roles',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['Administrator'], userPerms: ['Administrator'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      if (message.guild.ownerId !== message.author.id) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Only the **server owner** can manage main roles.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const action = args[0]?.toLowerCase();

      if (action === 'add') {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid role.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        await MainRole.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { roles: role.id }, $set: { updatedAt: new Date() } }, { upsert: true });

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${role} has been added to **main roles**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'remove') {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid role.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        await MainRole.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { roles: role.id }, $set: { updatedAt: new Date() } });

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${role} has been removed from **main roles**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'list') {
        const doc = await MainRole.findOne({ guildId: message.guild.id });
        const roles = doc?.roles || [];
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Main Roles`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          roles.length ? roles.map((id, i) => `${blackEmoji.arrow} ${i + 1}. <@&${id}>`).join('\n') : `${blackEmoji.info} No main roles set.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'reset') {
        await MainRole.deleteOne({ guildId: message.guild.id });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Main roles have been **reset**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}mainrole <add|remove|list|reset> [@role]\``));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  