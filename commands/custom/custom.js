const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const CustomSetup = require('@db/customSetup.js');

module.exports = {
  name: 'custom',
  aliases: ['cc', 'customcmd'],
  cooldown: '3',
  category: 'custom',
  usage: '<setup|remove|list|reset|manager>',
  description: 'Setup and manage custom role commands for this server',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageRoles'], userPerms: ['ManageRoles'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();
    const p = client.prefix;

    if (!action) {
      const doc = await CustomSetup.findOne({ guildId: message.guild.id });
      const count = doc?.roles?.length || 0;
      const managerRole = doc?.managerRole ? `<@&${doc.managerRole}>` : 'Not set';

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} Custom Role Commands\n` +
        `${blackEmoji.arrow} **Manager Role:** ${managerRole}\n` +
        `${blackEmoji.arrow} **Custom Roles:** ${count} configured\n\n` +
        `### Commands\n` +
        `> \`${p}custom setup <name> <@role>\` — Create a role command\n` +
        `> \`${p}custom remove <name>\` — Remove a role command\n` +
        `> \`${p}custom list\` — List all role commands\n` +
        `> \`${p}custom reset\` — Remove all role commands\n` +
        `> \`${p}custom manager <@role>\` — Set who can use role commands\n\n` +
        `### Usage\n` +
        `> Once set up, use \`${p}<name> @user\` to toggle a role.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'setup') {
      const name = args[1]?.toLowerCase();
      const role = message.mentions.roles.first() || (args[2] ? message.guild.roles.cache.get(args[2]) : null);

      if (!name || !role) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}custom setup <name> <@role>\`\n` +
          `${blackEmoji.arrow} Example: \`${p}custom setup staff @StaffRole\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (name.length > 32) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Name must be 32 characters or less.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const botCommand = client.commands.get(name);
      if (botCommand) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} **${name}** conflicts with an existing bot command. Choose a different name.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const doc = await CustomSetup.findOne({ guildId: message.guild.id });
      const existing = doc?.roles?.find(r => r.name === name);
      if (existing) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} A role command named **${name}** already exists.\n` +
          `${blackEmoji.info} Remove it first with \`${p}custom remove ${name}\` or choose a different name.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (doc?.roles?.length >= 25) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This server has reached the maximum of **25** custom role commands.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await CustomSetup.findOneAndUpdate(
        { guildId: message.guild.id },
        { $push: { roles: { name, roleId: role.id, createdBy: message.author.id } }, $set: { updatedAt: new Date() } },
        { upsert: true, new: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Custom role command created!\n` +
        `${blackEmoji.arrow} **Command:** \`${p}${name} @user\`\n` +
        `${blackEmoji.arrow} **Role:** ${role}\n` +
        `${blackEmoji.info} Use \`${p}${name} @user\` to toggle this role.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'remove') {
      const name = args[1]?.toLowerCase();
      if (!name) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}custom remove <name>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const result = await CustomSetup.findOneAndUpdate(
        { guildId: message.guild.id, 'roles.name': name },
        { $pull: { roles: { name } }, $set: { updatedAt: new Date() } },
        { new: true }
      );

      if (!result) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No custom role command named **${name}** found.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Removed custom role command **${name}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'list') {
      const doc = await CustomSetup.findOne({ guildId: message.guild.id });
      const c = new ContainerBuilder();

      if (!doc?.roles?.length) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.list} Custom Role Commands\n\n` +
          `${blackEmoji.info} No custom role commands set up yet.\n` +
          `Use \`${p}custom setup <name> <@role>\` to add one.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const lines = doc.roles.map((r, i) => {
        const role = message.guild.roles.cache.get(r.roleId);
        return `**${i + 1}.** \`${p}${r.name}\` → ${role ? role : `\`${r.roleId}\` (deleted)`}`;
      });

      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.list} Custom Role Commands — ${message.guild.name}`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      const managerRole = doc.managerRole ? `<@&${doc.managerRole}>` : 'Not set';
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Manager Role:** ${managerRole}\n` +
        `${blackEmoji.info} **Total:** ${doc.roles.length}/25 custom role commands`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'reset') {
      await CustomSetup.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { roles: [], managerRole: null, updatedAt: new Date() } }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} All custom role commands have been **reset**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'manager') {
      const role = message.mentions.roles.first() || (args[1] ? message.guild.roles.cache.get(args[1]) : null);

      if (args[1]?.toLowerCase() === 'none' || args[1]?.toLowerCase() === 'reset') {
        await CustomSetup.findOneAndUpdate(
          { guildId: message.guild.id },
          { $set: { managerRole: null, updatedAt: new Date() } },
          { upsert: true }
        );
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.yes} Manager role **removed**. Only users with Manage Roles permission can use custom role commands.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (!role) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}custom manager <@role>\` or \`${p}custom manager none\`\n` +
          `${blackEmoji.arrow} Users with this role can use \`${p}<name> @user\` to toggle roles.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await CustomSetup.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { managerRole: role.id, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Manager role set to ${role}.\n` +
        `${blackEmoji.info} Users with this role can now use custom role commands.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} Unknown subcommand. Use \`${p}custom\` to see all options.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
