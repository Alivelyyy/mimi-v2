const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Automod = require('@db/automod.js');

const MODULES = {
  antilinks: { field: 'antiLinks', label: 'Anti-Links', desc: 'Deletes messages with URLs' },
  antiinvites: { field: 'antiInvites', label: 'Anti-Invites', desc: 'Deletes Discord invite links' },
  antispam: { field: 'antiSpam', label: 'Anti-Spam', desc: 'Detects rapid message spam' },
  antimention: { field: 'antiMassMention', label: 'Anti-Mass Mention', desc: 'Limits mentions per message' },
  anticaps: { field: 'antiCaps', label: 'Anti-Caps', desc: 'Limits excessive caps usage' },
};

module.exports = {
  name: 'automod',
  aliases: ['am', 'filter2'],
  cooldown: '3',
  category: 'automod',
  usage: '<enable|disable|module|punishment|config|logging|threshold|ignore|unignore|reset>',
  description: 'Configure the automod system with message filtering, spam detection, and more',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['Administrator'], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();
    const p = client.prefix;

    if (!action) {
      const doc = await Automod.findOne({ guildId: message.guild.id });
      const on = blackEmoji.on;
      const off = blackEmoji.off;

      let modLines = '';
      for (const [, m] of Object.entries(MODULES)) {
        modLines += `> ${doc?.[m.field] ? on : off} **${m.label}** — ${m.desc}\n`;
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} AutoMod System\n` +
        `${blackEmoji.arrow} Status: ${doc?.enabled ? `${on} Active` : `${off} Inactive`}\n\n` +
        `### Commands\n` +
        `> \`${p}automod enable\` — Turn on automod\n` +
        `> \`${p}automod disable\` — Turn off automod\n` +
        `> \`${p}automod module <name> <on/off>\` — Toggle modules\n` +
        `> \`${p}automod punishment <mute/kick/ban/warn>\`\n` +
        `> \`${p}automod threshold <mention/caps> <number>\`\n` +
        `> \`${p}automod logging #channel\` — Set log channel\n` +
        `> \`${p}automod config\` — View full config\n` +
        `> \`${p}automod ignore <channel/role> <target>\`\n` +
        `> \`${p}automod unignore <channel/role> <target>\`\n` +
        `> \`${p}automod reset\` — Reset all settings\n\n` +
        `### Modules\n${modLines}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'enable') {
      await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $set: { enabled: true, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} AutoMod has been **enabled**.\n` +
        `${blackEmoji.info} Toggle modules with \`${p}automod module <name> on\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'disable') {
      await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $set: { enabled: false, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} AutoMod has been **disabled**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'module' || action === 'mod') {
      const modName = args[1]?.toLowerCase();
      const toggle = args[2]?.toLowerCase();
      const validNames = Object.keys(MODULES);

      if (!modName || !['on', 'off', 'enable', 'disable'].includes(toggle)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}automod module <name> <on/off>\`\n\n` +
          `**Modules:** ${validNames.map(k => `\`${k}\``).join(', ')}`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (!MODULES[modName]) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} Unknown module. Valid: ${validNames.map(k => `\`${k}\``).join(', ')}`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const enabled = ['on', 'enable'].includes(toggle);
      await Automod.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { [MODULES[modName].field]: enabled, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} **${MODULES[modName].label}** has been ${enabled ? 'enabled' : 'disabled'}.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'punishment' || action === 'punish') {
      const pun = args[1]?.toLowerCase();
      if (!['mute', 'kick', 'ban', 'warn'].includes(pun)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}automod punishment <mute|kick|ban|warn>\`\n\n` +
          `> **warn** — Warn the user\n> **mute** — Timeout the user\n> **kick** — Kick the user\n> **ban** — Ban the user`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $set: { punishment: pun, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} AutoMod punishment set to **${pun}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'threshold') {
      const type = args[1]?.toLowerCase();
      const val = parseInt(args[2]);

      if (type === 'mention') {
        if (isNaN(val) || val < 2 || val > 50) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Mention limit must be between **2** and **50**.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $set: { massMentionLimit: val, updatedAt: new Date() } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Mass mention limit set to **${val}**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (type === 'caps') {
        if (isNaN(val) || val < 30 || val > 100) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Caps limit must be between **30** and **100** (percentage).`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $set: { capsLimit: val, updatedAt: new Date() } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Caps limit set to **${val}%**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.info} **Usage:**\n` +
        `\`${p}automod threshold mention <2-50>\`\n` +
        `\`${p}automod threshold caps <30-100>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'config' || action === 'status') {
      const doc = await Automod.findOne({ guildId: message.guild.id });
      const on = blackEmoji.on;
      const off = blackEmoji.off;
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} AutoMod Configuration\n` +
        `${blackEmoji.arrow} **Status:** ${doc?.enabled ? `${on} Active` : `${off} Inactive`}\n` +
        `${blackEmoji.arrow} **Punishment:** \`${doc?.punishment}\`\n` +
        `${blackEmoji.arrow} **Log Channel:** ${doc?.logChannelId ? `<#${doc.logChannelId}>` : 'Not set'}\n\n` +
        `### Modules\n` +
        `> ${doc?.antiLinks ? on : off} **Anti-Links**\n` +
        `> ${doc?.antiInvites ? on : off} **Anti-Invites**\n` +
        `> ${doc?.antiSpam ? on : off} **Anti-Spam**\n` +
        `> ${doc?.antiMassMention ? on : off} **Anti-Mass Mention** — Limit: \`${doc?.massMentionLimit || 5}\`\n` +
        `> ${doc?.antiCaps ? on : off} **Anti-Caps** — Limit: \`${doc?.capsLimit || 70}%\`\n\n` +
        `### Ignores\n` +
        `> **Channels:** ${doc?.ignoredChannels?.length || 0}\n` +
        `> **Roles:** ${doc?.ignoredRoles?.length || 0}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'logging' || action === 'log') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (channel && !channel.isTextBased()) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} That channel is not a text channel.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (!channel) {
        const doc = await Automod.findOne({ guildId: message.guild.id });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Current:** ${doc?.logChannelId ? `<#${doc.logChannelId}>` : 'Not set'}\n**Usage:** \`${p}automod logging #channel\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $set: { logChannelId: channel.id, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} AutoMod log channel set to ${channel}.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'ignore') {
      const sub = args[1]?.toLowerCase();
      if (sub === 'channel') {
        const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
        if (!ch) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a channel.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { ignoredChannels: ch.id }, $set: { updatedAt: new Date() } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${ch} is now ignored by automod.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (sub === 'role') {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);
        if (!role) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { ignoredRoles: role.id }, $set: { updatedAt: new Date() } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${role} is now ignored by automod.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (sub === 'show' || sub === 'list') {
        const doc = await Automod.findOne({ guildId: message.guild.id });
        const channels = doc?.ignoredChannels?.map(id => `<#${id}>`).join(', ');
        const roles = doc?.ignoredRoles?.map(id => `<@&${id}>`).join(', ');
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} AutoMod Ignored\n\n**Channels:** ${channels}\n**Roles:** ${roles}`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (sub === 'reset') {
        await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $set: { ignoredChannels: [], ignoredRoles: [], updatedAt: new Date() } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} All automod ignores have been **reset**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}automod ignore <channel|role|show|reset>\``));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'unignore') {
      const sub = args[1]?.toLowerCase();
      if (sub === 'channel') {
        const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
        if (!ch) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a channel.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { ignoredChannels: ch.id } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${ch} is no longer ignored.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (sub === 'role') {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);
        if (!role) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await Automod.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { ignoredRoles: role.id } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${role} is no longer ignored.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}automod unignore <channel|role>\``));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'reset') {
      await Automod.deleteOne({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} All AutoMod settings have been **reset**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} Unknown subcommand. Use \`${p}automod\` to see all options.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};
