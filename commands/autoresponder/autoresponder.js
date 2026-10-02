const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Autoresponder = require('@db/autoresponder.js');

module.exports = {
  name: 'autoresponder',
  aliases: ['autoresp', 'responder'],
  cooldown: '3',
  category: 'autoresponder',
  usage: '<create|delete|edit|list|enable|disable|exactmatch|variables>',
  description: 'Auto-reply to specific trigger words or phrases',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();
    const p = client.prefix;

    if (!action) {
      const docs = await Autoresponder.find({ guildId: message.guild.id });
      const on = blackEmoji.on;
      const off = blackEmoji.off;
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.message} Autoresponder System\n` +
        `${blackEmoji.arrow} Active Triggers: **${docs.filter(d => d.enabled).length}** / ${docs.length}\n\n` +
        `### Commands\n` +
        `> \`${p}autoresponder create <trigger> <response>\`\n` +
        `> \`${p}autoresponder delete <trigger>\`\n` +
        `> \`${p}autoresponder edit <trigger> <new response>\`\n` +
        `> \`${p}autoresponder list\` — View all triggers\n` +
        `> \`${p}autoresponder enable <trigger>\`\n` +
        `> \`${p}autoresponder disable <trigger>\`\n` +
        `> \`${p}autoresponder exactmatch <trigger> <on/off>\`\n` +
        `> \`${p}autoresponder variables\` — See available variables\n` +
        `> \`${p}autoresponder reset\` — Remove all triggers`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'create' || action === 'add') {
      const trigger = args[1]?.toLowerCase();
      const response = args.slice(2).join(' ');
      if (!trigger || !response) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}autoresponder create <trigger> <response>\`\n` +
          `${blackEmoji.arrow} Example: \`${p}autoresponder create hello Hey there {user}!\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const count = await Autoresponder.countDocuments({ guildId: message.guild.id });
      if (count >= 50) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Maximum of **50** autoresponders reached.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const existing = await Autoresponder.findOne({ guildId: message.guild.id, trigger });
      if (existing) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Trigger \`${trigger}\` already exists. Use \`${p}autoresponder edit\` to update it.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Autoresponder.create({ guildId: message.guild.id, trigger, response, createdBy: message.author.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Autoresponder created!\n` +
        `${blackEmoji.arrow} **Trigger:** \`${trigger}\`\n` +
        `${blackEmoji.arrow} **Response:** ${response.slice(0, 100)}${response.length > 100 ? '...' : ''}\n` +
        `${blackEmoji.arrow} **Match:** Contains (use \`exactmatch\` for exact)`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'delete' || action === 'del' || action === 'remove') {
      const trigger = args[1]?.toLowerCase();
      if (!trigger) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}autoresponder delete <trigger>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Autoresponder.deleteOne({ guildId: message.guild.id, trigger });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res.deletedCount ? `${blackEmoji.yes} Autoresponder \`${trigger}\` deleted.` : `${blackEmoji.no} No autoresponder found with trigger \`${trigger}\`.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'edit') {
      const trigger = args[1]?.toLowerCase();
      const response = args.slice(2).join(' ');
      if (!trigger || !response) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}autoresponder edit <trigger> <new response>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Autoresponder.findOneAndUpdate({ guildId: message.guild.id, trigger }, { $set: { response } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Autoresponder \`${trigger}\` updated.` : `${blackEmoji.no} No autoresponder found with trigger \`${trigger}\`.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'enable') {
      const trigger = args[1]?.toLowerCase();
      if (!trigger) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}autoresponder enable <trigger>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Autoresponder.findOneAndUpdate({ guildId: message.guild.id, trigger }, { $set: { enabled: true } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Autoresponder \`${trigger}\` **enabled**.` : `${blackEmoji.no} No autoresponder found with trigger \`${trigger}\`.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'disable') {
      const trigger = args[1]?.toLowerCase();
      if (!trigger) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}autoresponder disable <trigger>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Autoresponder.findOneAndUpdate({ guildId: message.guild.id, trigger }, { $set: { enabled: false } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} Autoresponder \`${trigger}\` **disabled**.` : `${blackEmoji.no} No autoresponder found with trigger \`${trigger}\`.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'exactmatch' || action === 'exact') {
      const trigger = args[1]?.toLowerCase();
      const toggle = args[2]?.toLowerCase();
      if (!trigger || !['on', 'off'].includes(toggle)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}autoresponder exactmatch <trigger> <on/off>\`\n\n` +
          `> **on** — Only triggers on exact message match\n` +
          `> **off** — Triggers when message contains the trigger`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const exact = toggle === 'on';
      const res = await Autoresponder.findOneAndUpdate({ guildId: message.guild.id, trigger }, { $set: { exactMatch: exact } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res ? `${blackEmoji.yes} \`${trigger}\` exact match set to **${exact ? 'on' : 'off'}**.` : `${blackEmoji.no} No autoresponder found with trigger \`${trigger}\`.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'list' || action === 'config') {
      const docs = await Autoresponder.find({ guildId: message.guild.id });
      const on = blackEmoji.on;
      const off = blackEmoji.off;
      if (!docs.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} No autoresponders configured. Use \`${p}autoresponder create\` to add one.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const lines = docs.slice(0, 15).map((d, i) => {
        const status = d.enabled ? on : off;
        const match = d.exactMatch ? '`exact`' : '`contains`';
        return `> ${status} ${i + 1}. \`${d.trigger}\` → ${d.response.slice(0, 40)}${d.response.length > 40 ? '...' : ''} ${match}`;
      });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.message} Autoresponders (${docs.length})\n\n${lines.join('\n')}` +
        (docs.length > 15 ? `\n\n${blackEmoji.info} Showing 15 of ${docs.length}` : '')
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'variables' || action === 'vars') {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.info} Autoresponder Variables\n\n` +
        `> \`{user}\` — Mentions the user\n` +
        `> \`{username}\` — User's display name\n` +
        `> \`{server}\` — Server name\n` +
        `> \`{membercount}\` — Server member count\n\n` +
        `**Example:** \`Welcome {user} to {server}!\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'reset') {
      const res = await Autoresponder.deleteMany({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Removed **${res.deletedCount}** autoresponder(s).`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} Unknown subcommand. Use \`${p}autoresponder\` to see all options.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
