const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'role',
  aliases: ['r', 'roles'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user> <@role> | <create|delete|rename|all|humans|bots>',
  description: 'Role management commands',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageRoles'], userPerms: ['ManageRoles'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();

    if (action === 'create') {
      const name = args.slice(1).join(' ');
      try {
        const role = await message.guild.roles.create({ name, reason: `Created by ${message.author.tag}` });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Role Created`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Role:** ${role}\n` +
          `${blackEmoji.mod} **Created by:** ${message.author.tag}`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      } catch (err) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to create role: ${err.message}`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
    }

    if (action === 'delete') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role to delete.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (!role.editable) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} I cannot delete **${role.name}** \u2014 it may be higher than my role.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      try {
        const roleName = role.name;
        await role.delete(`Deleted by ${message.author.tag}`);
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Deleted role **${roleName}**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      } catch (err) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
    }

    if (action === 'rename') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      const newName = args.slice(2).join(' ');
      if (!role || !newName) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}role rename @role <new name>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (!role.editable) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} I cannot rename **${role.name}**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      try {
        const oldName = role.name;
        await role.setName(newName);
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.yes} Role renamed: **${oldName}** \u2192 **${newName}**`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      } catch (err) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
    }

    if (action === 'all') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const loadMsg = await message.reply({ components: [(() => { const c = new ContainerBuilder(); c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading} Adding role to all members...`)); return c; })()], flags: MessageFlags.IsComponentsV2 });
      const members = await message.guild.members.fetch();
      let count = 0;
      for (const [, m] of members) {
        if (!m.roles.cache.has(role.id)) { await m.roles.add(role).catch(() => {}); count++; }
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Added ${role} to **${count}** members.`));
      return loadMsg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'humans') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const loadMsg = await message.reply({ components: [(() => { const c = new ContainerBuilder(); c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading} Adding role to humans...`)); return c; })()], flags: MessageFlags.IsComponentsV2 });
      const members = (await message.guild.members.fetch()).filter(m => !m.user.bot);
      let count = 0;
      for (const [, m] of members) {
        if (!m.roles.cache.has(role.id)) { await m.roles.add(role).catch(() => {}); count++; }
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Added ${role} to **${count}** humans.`));
      return loadMsg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'bots') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const loadMsg = await message.reply({ components: [(() => { const c = new ContainerBuilder(); c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading} Adding role to bots...`)); return c; })()], flags: MessageFlags.IsComponentsV2 });
      const bots = (await message.guild.members.fetch()).filter(m => m.user.bot);
      let count = 0;
      for (const [, m] of bots) {
        if (!m.roles.cache.has(role.id)) { await m.roles.add(role).catch(() => {}); count++; }
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Added ${role} to **${count}** bots.`));
      return loadMsg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!member || !role) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} Role Management\n\n` +
        `${blackEmoji.arrow} \`${client.prefix}role @user @role\` \u2014 Toggle role\n` +
        `${blackEmoji.arrow} \`${client.prefix}role create <name>\` \u2014 Create role\n` +
        `${blackEmoji.arrow} \`${client.prefix}role delete @role\` \u2014 Delete role\n` +
        `${blackEmoji.arrow} \`${client.prefix}role rename @role <name>\` \u2014 Rename role\n` +
        `${blackEmoji.arrow} \`${client.prefix}role all @role\` \u2014 Give to all\n` +
        `${blackEmoji.arrow} \`${client.prefix}role humans @role\` \u2014 Give to humans\n` +
        `${blackEmoji.arrow} \`${client.prefix}role bots @role\` \u2014 Give to bots`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (!role.editable) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} I cannot manage **${role.name}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} Removed ${role} from **${member.displayName}**.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      } else {
        await member.roles.add(role);
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.yes} Added ${role} to **${member.displayName}**.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
