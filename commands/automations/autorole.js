const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Autorole = require('@db/autorole.js');

module.exports = {
  name: 'autorole',
  aliases: ['ar', 'joinrole'],
  cooldown: '3',
  category: 'automations',
  usage: '<humans|bots|enable|disable|config|reset> [add|remove] [@role]',
  description: 'Automatically assign roles to new humans and bots on join',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageRoles'], userPerms: ['ManageRoles'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();
    const p = client.prefix;

    if (!action) {
      const doc = await Autorole.findOne({ guildId: message.guild.id });
      const on = blackEmoji.on;
      const off = blackEmoji.off;
      const humanRoles = doc?.humanRoles?.length || 0;
      const botRoles = doc?.botRoles?.length || 0;

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} Autorole System\n` +
        `${blackEmoji.arrow} Status: ${doc?.enabled !== false ? `${on} Active` : `${off} Inactive`}\n` +
        `${blackEmoji.arrow} Human Roles: **${humanRoles}** configured\n` +
        `${blackEmoji.arrow} Bot Roles: **${botRoles}** configured\n\n` +
        `### Commands\n` +
        `> \`${p}autorole enable\` — Turn on autorole\n` +
        `> \`${p}autorole disable\` — Turn off autorole\n` +
        `> \`${p}autorole humans add @role\` — Add role for humans\n` +
        `> \`${p}autorole humans remove @role\` — Remove role\n` +
        `> \`${p}autorole humans\` — View human roles\n` +
        `> \`${p}autorole bots add @role\` — Add role for bots\n` +
        `> \`${p}autorole bots remove @role\` — Remove role\n` +
        `> \`${p}autorole bots\` — View bot roles\n` +
        `> \`${p}autorole config\` — View full config\n` +
        `> \`${p}autorole reset <all|bots|humans>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'enable') {
      await Autorole.findOneAndUpdate({ guildId: message.guild.id }, { $set: { enabled: true, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Autorole has been **enabled**.\n` +
        `${blackEmoji.info} Add roles with \`${p}autorole humans add @role\` or \`${p}autorole bots add @role\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'disable') {
      await Autorole.findOneAndUpdate({ guildId: message.guild.id }, { $set: { enabled: false, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Autorole has been **disabled**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'humans' || action === 'bots') {
      const sub = args[1]?.toLowerCase();
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);
      const field = action === 'humans' ? 'humanRoles' : 'botRoles';
      const label = action === 'humans' ? 'Humans' : 'Bots';

      if (sub === 'add') {
        if (!role) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (!role.editable) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} I can't assign ${role} — it's above my highest role.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await Autorole.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { [field]: role.id }, $set: { updatedAt: new Date() } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${role} will be given to new **${label.toLowerCase()}**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (sub === 'remove') {
        if (!role) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await Autorole.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { [field]: role.id } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${role} removed from **${label.toLowerCase()}** autorole.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const doc = await Autorole.findOne({ guildId: message.guild.id });
      const roles = doc?.[field] || [];
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.list} Autorole — ${label}\n\n` +
        (roles.length ? roles.map((id, i) => `${blackEmoji.arrow} ${i + 1}. <@&${id}>`).join('\n') : `${blackEmoji.info} No roles configured.`)
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'config') {
      const doc = await Autorole.findOne({ guildId: message.guild.id });
      const on = blackEmoji.on;
      const off = blackEmoji.off;
      const humanList = doc?.humanRoles?.map(id => `<@&${id}>`).join(', ');
      const botList = doc?.botRoles?.map(id => `<@&${id}>`).join(', ');
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} Autorole Config\n\n` +
        `${blackEmoji.arrow} **Status:** ${doc?.enabled !== false ? `${on} Active` : `${off} Inactive`}\n` +
        `${blackEmoji.arrow} **Human Roles:** ${humanList}\n` +
        `${blackEmoji.arrow} **Bot Roles:** ${botList}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'reset') {
      const sub = args[1]?.toLowerCase();
      if (sub === 'bots') {
        await Autorole.findOneAndUpdate({ guildId: message.guild.id }, { $set: { botRoles: [] } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Bot autoroles have been **reset**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (sub === 'humans') {
        await Autorole.findOneAndUpdate({ guildId: message.guild.id }, { $set: { humanRoles: [] } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Human autoroles have been **reset**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Autorole.deleteOne({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} All autorole settings have been **reset**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} Unknown subcommand. Use \`${p}autorole\` to see all options.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};
