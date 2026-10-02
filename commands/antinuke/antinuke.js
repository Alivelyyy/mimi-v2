const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ChannelType,
  PermissionsBitField,
  MessageFlags,
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Antinuke = require('@db/antinuke.js');
const { MODULE_INFO } = require('../../plugins/antinuke.js');

function ownerOnly(message) {
  if (message.guild.ownerId === message.author.id) return null;
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `${blackEmoji.no} Only the **server owner** can manage anti-nuke.`
  ));
  return c;
}

function statusEmoji(val) { return val ? blackEmoji.on : blackEmoji.off; }

module.exports = {
  name: 'antinuke',
  aliases: ['an', 'nukeprotect'],
  cooldown: '5',
  category: 'antinuke',
  usage: '<enable|disable|status|setup|module|limit|punishment|logchannel>',
  description: 'Configure the full anti-nuke protection system for your server',
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ['Administrator'],
  userPerms: ['Administrator'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();
    const p = client.prefix;

    if (!action) {
      const doc = await Antinuke.findOne({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.danger} Anti-Nuke System\n` +
        `${blackEmoji.arrow} Status: ${statusEmoji(doc?.enabled)} ${doc?.enabled ? 'Active' : 'Inactive'}\n\n` +
        `### Commands\n` +
        `> \`${p}antinuke enable\` — Turn on protection\n` +
        `> \`${p}antinuke disable\` — Turn off protection\n` +
        `> \`${p}antinuke setup\` — One-click setup with log channel\n` +
        `> \`${p}antinuke status\` — View full config\n` +
        `> \`${p}antinuke module <name> <on/off>\` — Toggle modules\n` +
        `> \`${p}antinuke limit <module> <1-20>\` — Set thresholds\n` +
        `> \`${p}antinuke punishment <ban/kick/strip/quarantine>\`\n` +
        `> \`${p}antinuke logchannel [#channel]\` — Set alert channel\n` +
        `> \`${p}whitelist @user\` / \`${p}unwhitelist @user\`\n` +
        `> \`${p}whitelisted\` / \`${p}admin add @user\`\n` +
        `> \`${p}mainrole add @role\` — Protect important roles`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'enable') {
      const guard = ownerOnly(message);
      if (guard) return message.reply({ components: [guard], flags: MessageFlags.IsComponentsV2 });

      await Antinuke.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { enabled: true, updatedAt: new Date() } },
        { upsert: true, new: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.on} Anti-Nuke Enabled\n` +
        `${blackEmoji.yes} Protection is now **active** for **${message.guild.name}**.\n\n` +
        `All 12 modules are enabled with default thresholds.\n` +
        `${blackEmoji.info} Run \`${p}antinuke status\` to view configuration.\n` +
        `${blackEmoji.info} Run \`${p}antinuke setup\` to auto-create a log channel.\n` +
        `${blackEmoji.info} Run \`${p}whitelist @user\` to whitelist trusted members.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'disable') {
      const guard = ownerOnly(message);
      if (guard) return message.reply({ components: [guard], flags: MessageFlags.IsComponentsV2 });

      await Antinuke.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { enabled: false, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.off} Anti-Nuke Disabled\n` +
        `${blackEmoji.warn} Protection has been turned **off**. Your server is no longer guarded.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'status' || action === 'config' || action === 'info') {
      const doc = await Antinuke.findOne({ guildId: message.guild.id });
      const c = new ContainerBuilder();

      let moduleLines = '';
      for (const [key, info] of Object.entries(MODULE_INFO)) {
        const mod = doc?.modules?.[key];
        const enabled = mod?.enabled ?? true;
        const limitStr = info.hasLimit ? ` — Limit: \`${mod?.limit ?? 3}\`` : '';
        moduleLines += `> ${statusEmoji(enabled)} **${info.label}**${limitStr}\n`;
      }

      const logCh = doc?.logChannelId ? `<#${doc.logChannelId}>` : 'Not set';
      const qRole = doc?.quarantineRoleId ? `<@&${doc.quarantineRoleId}>` : 'Not set';

      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.danger} Anti-Nuke Status\n` +
        `${blackEmoji.arrow} **Status:** ${statusEmoji(doc?.enabled)} ${doc?.enabled ? 'Active' : 'Inactive'}\n` +
        `${blackEmoji.arrow} **Punishment:** \`${doc?.punishment}\`\n` +
        `${blackEmoji.arrow} **Log Channel:** ${logCh}\n` +
        `${blackEmoji.arrow} **Quarantine Role:** ${qRole}\n` +
        `${blackEmoji.arrow} **Whitelisted:** ${doc?.whitelist?.length || 0} users\n\n` +
        `### Modules\n${moduleLines}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'setup') {
      const guard = ownerOnly(message);
      if (guard) return message.reply({ components: [guard], flags: MessageFlags.IsComponentsV2 });

      const confirmC = new ContainerBuilder();
      confirmC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.warn} Anti-Nuke Setup\n` +
        `This will:\n` +
        `> ${blackEmoji.yes} Enable all 12 protection modules\n` +
        `> ${blackEmoji.yes} Create a \`#antinuke-logs\` channel (admin-only)\n` +
        `> ${blackEmoji.yes} Create a \`Quarantined\` role (no permissions)\n` +
        `> ${blackEmoji.yes} Set punishment to **ban**\n\n` +
        `${blackEmoji.info} Continue?`
      ));
      confirmC.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('an_setup_yes').setLabel('Setup Now').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('an_setup_no').setLabel('Cancel').setStyle(ButtonStyle.Danger),
        )
      );

      const confirmMsg = await message.reply({ components: [confirmC], flags: MessageFlags.IsComponentsV2 });

      let interaction;
      try {
        interaction = await confirmMsg.awaitMessageComponent({
          filter: (i) => i.user.id === message.author.id,
          time: 30000,
          componentType: ComponentType.Button,
        });
      } catch {
        const tc = new ContainerBuilder();
        tc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Setup timed out.`));
        return confirmMsg.edit({ components: [tc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      if (interaction.customId === 'an_setup_no') {
        const cc = new ContainerBuilder();
        cc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Setup cancelled.`));
        return interaction.update({ components: [cc], flags: MessageFlags.IsComponentsV2 });
      }

      const pc = new ContainerBuilder();
      pc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading || blackEmoji.info} Setting up anti-nuke...`));
      await interaction.update({ components: [pc], flags: MessageFlags.IsComponentsV2 });

      let logChannel = message.guild.channels.cache.find(c => c.name === 'antinuke-logs' && c.type === ChannelType.GuildText);
      if (!logChannel) {
        try {
          logChannel = await message.guild.channels.create({
            name: 'antinuke-logs',
            type: ChannelType.GuildText,
            permissionOverwrites: [
              { id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
              { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
              { id: message.author.id, allow: [PermissionsBitField.Flags.ViewChannel] },
            ],
            topic: 'Anti-Nuke alert logs — managed by ' + client.user.username,
          });
        } catch (_) { logChannel = null; }
      }

      let qRole = message.guild.roles.cache.find(r => r.name === 'Quarantined');
      if (!qRole) {
        try {
          qRole = await message.guild.roles.create({
            name: 'Quarantined',
            color: 0x2b2d31,
            permissions: [],
            reason: 'Anti-Nuke setup — quarantine role',
          });
        } catch (_) { qRole = null; }
      }

      await Antinuke.findOneAndUpdate(
        { guildId: message.guild.id },
        {
          $set: {
            enabled: true,
            punishment: 'ban',
            logChannelId: logChannel?.id || null,
            quarantineRoleId: qRole?.id || null,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      const rc = new ContainerBuilder();
      rc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.yes} Anti-Nuke Setup Complete\n` +
        `${blackEmoji.yes} All 12 modules **enabled** with default limits\n` +
        `${blackEmoji.yes} Log channel: ${logChannel ? `<#${logChannel.id}>` : 'Failed to create'}\n` +
        `${blackEmoji.yes} Quarantine role: ${qRole ? `<@&${qRole.id}>` : 'Failed to create'}\n` +
        `${blackEmoji.yes} Punishment: **ban**\n\n` +
        `${blackEmoji.info} Whitelist trusted users: \`${p}whitelist @user\`\n` +
        `${blackEmoji.info} View config: \`${p}antinuke status\``
      ));
      return confirmMsg.edit({ components: [rc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    if (action === 'module' || action === 'mod') {
      const guard = ownerOnly(message);
      if (guard) return message.reply({ components: [guard], flags: MessageFlags.IsComponentsV2 });

      const modName = args[1]?.toLowerCase();
      const toggle = args[2]?.toLowerCase();
      const validModules = Object.keys(MODULE_INFO);

      if (!modName || !['on', 'off', 'enable', 'disable'].includes(toggle)) {
        const moduleList = validModules.map(k => `\`${k}\``).join(', ');
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}antinuke module <name> <on/off>\`\n\n` +
          `**Modules:** ${moduleList}`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (!validModules.includes(modName)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} Unknown module \`${modName}\`. Valid: ${validModules.map(k => `\`${k}\``).join(', ')}`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const enabled = ['on', 'enable'].includes(toggle);
      await Antinuke.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { [`modules.${modName}.enabled`]: enabled, updatedAt: new Date() } },
        { upsert: true }
      );

      const info = MODULE_INFO[modName];
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} **${info.label}** has been ${enabled ? 'enabled' : 'disabled'}.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'limit') {
      const guard = ownerOnly(message);
      if (guard) return message.reply({ components: [guard], flags: MessageFlags.IsComponentsV2 });

      const modName = args[1]?.toLowerCase();
      const value = parseInt(args[2]);
      const limitModules = Object.entries(MODULE_INFO).filter(([, v]) => v.hasLimit).map(([k]) => k);

      if (!modName || isNaN(value)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}antinuke limit <module> <1-20>\`\n\n` +
          `**Modules with limits:** ${limitModules.map(k => `\`${k}\``).join(', ')}`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (!limitModules.includes(modName)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} Module \`${modName}\` doesn't support limits. Valid: ${limitModules.map(k => `\`${k}\``).join(', ')}`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (value < 1 || value > 20) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Limit must be between **1** and **20**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Antinuke.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { [`modules.${modName}.limit`]: value, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} **${MODULE_INFO[modName].label}** limit set to \`${value}\`.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'punishment' || action === 'punish') {
      const guard = ownerOnly(message);
      if (guard) return message.reply({ components: [guard], flags: MessageFlags.IsComponentsV2 });

      const val = args[1]?.toLowerCase();
      if (!['ban', 'kick', 'strip', 'quarantine'].includes(val)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}antinuke punishment <ban|kick|strip|quarantine>\`\n\n` +
          `> **ban** — Ban the offender\n` +
          `> **kick** — Kick the offender\n` +
          `> **strip** — Remove all roles\n` +
          `> **quarantine** — Strip roles + assign quarantine role`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Antinuke.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { punishment: val, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Punishment set to **${val}**.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'logchannel' || action === 'log' || action === 'logs') {
      const guard = ownerOnly(message);
      if (guard) return message.reply({ components: [guard], flags: MessageFlags.IsComponentsV2 });

      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) {
        const doc = await Antinuke.findOne({ guildId: message.guild.id });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Current log channel:** ${doc?.logChannelId ? `<#${doc.logChannelId}>` : 'Not set'}\n\n` +
          `**Usage:** \`${p}antinuke logchannel #channel\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Antinuke.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { logChannelId: channel.id, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Anti-nuke log channel set to ${channel}.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} Unknown subcommand. Use \`${p}antinuke\` to see all options.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};
