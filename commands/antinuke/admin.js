const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const AdminList = require('@db/adminList.js');

  module.exports = {
    name: 'admin',
    aliases: ['an-admin', 'anadmin'],
    cooldown: '',
    category: 'antinuke',
    usage: '<add|remove|view|reset> [@user]',
    description: 'Manage the admin list for anti-nuke',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['Administrator'], userPerms: ['Administrator'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      if (message.guild.ownerId !== message.author.id) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Only the **server owner** can manage admins.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const action = args[0]?.toLowerCase();

      if (action === 'add') {
        const user = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
        if (!user) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid user.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await AdminList.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { admins: user.id }, $set: { updatedAt: new Date() } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} **${user.tag}** has been added as an admin.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'remove') {
        const user = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
        if (!user) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid user.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await AdminList.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { admins: user.id }, $set: { updatedAt: new Date() } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} **${user.tag}** has been removed from admins.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'view' || action === 'list') {
        const doc = await AdminList.findOne({ guildId: message.guild.id });
        const admins = doc?.admins || [];
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.admin} Admin List`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          admins.length ? admins.map((id, i) => `${blackEmoji.arrow} ${i + 1}. <@${id}> (\`${id}\`)`).join('\n') : `${blackEmoji.info} No admins configured.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'reset') {
        await AdminList.deleteOne({ guildId: message.guild.id });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Admin list has been **reset**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}admin <add|remove|view|reset> [@user]\``));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  