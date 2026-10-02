const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Antibot = require('@db/antibot.js');

module.exports = {
  name: 'antibot',
  aliases: ['ab', 'botprotect'],
  cooldown: '3',
  category: 'automod',
  usage: '<enable|disable|action|add|remove|wl|config|reset>',
  description: 'Block unauthorized bots from joining your server',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['Administrator'], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();
    const p = client.prefix;

    if (!action) {
      const doc = await Antibot.findOne({ guildId: message.guild.id });
      const on = blackEmoji.on;
      const off = blackEmoji.off;
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.danger} Anti-Bot System\n` +
        `${blackEmoji.arrow} Status: ${doc?.enabled ? `${on} Active` : `${off} Inactive`}\n` +
        `${blackEmoji.arrow} Action: \`${doc?.action}\`\n` +
        `${blackEmoji.arrow} Whitelisted: ${doc?.whitelist?.length || 0} bots\n\n` +
        `### Commands\n` +
        `> \`${p}antibot enable\` — Turn on protection\n` +
        `> \`${p}antibot disable\` — Turn off protection\n` +
        `> \`${p}antibot action <kick/ban>\` — Set action\n` +
        `> \`${p}antibot add <botId>\` — Whitelist a bot\n` +
        `> \`${p}antibot remove <botId>\` — Remove from whitelist\n` +
        `> \`${p}antibot wl\` — View whitelist\n` +
        `> \`${p}antibot config\` — View config\n` +
        `> \`${p}antibot reset\` — Reset all settings\n\n` +
        `${blackEmoji.info} Whitelisted bots can join freely. All others get kicked or banned.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'enable') {
      await Antibot.findOneAndUpdate({ guildId: message.guild.id }, { $set: { enabled: true, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Anti-Bot has been **enabled**. Unwhitelisted bots will be removed on join.\n` +
        `${blackEmoji.info} Whitelist bots with \`${p}antibot add <botId>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'disable') {
      await Antibot.findOneAndUpdate({ guildId: message.guild.id }, { $set: { enabled: false, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Anti-Bot has been **disabled**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'action') {
      const val = args[1]?.toLowerCase();
      if (!['kick', 'ban'].includes(val)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}antibot action <kick|ban>\`\n\n` +
          `> **kick** — Kick the bot\n> **ban** — Ban the bot`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Antibot.findOneAndUpdate({ guildId: message.guild.id }, { $set: { action: val, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Anti-Bot action set to **${val}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'add') {
      const botId = args[1];
      if (!botId) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide a bot ID to whitelist.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Antibot.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { whitelist: botId }, $set: { updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Bot \`${botId}\` has been **whitelisted**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'remove') {
      const botId = args[1];
      if (!botId) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide a bot ID to remove.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Antibot.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { whitelist: botId } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Bot \`${botId}\` has been removed from whitelist.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'wl' || action === 'whitelist') {
      const doc = await Antibot.findOne({ guildId: message.guild.id });
      const wl = doc?.whitelist || [];
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.list} Anti-Bot Whitelist\n\n` +
        (wl.length ? wl.map((id, i) => `${blackEmoji.arrow} ${i + 1}. \`${id}\``).join('\n') : `${blackEmoji.info} No bots whitelisted.`)
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'config') {
      const doc = await Antibot.findOne({ guildId: message.guild.id });
      const on = blackEmoji.on;
      const off = blackEmoji.off;
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.danger} Anti-Bot Config\n\n` +
        `${blackEmoji.arrow} **Status:** ${doc?.enabled ? `${on} Active` : `${off} Inactive`}\n` +
        `${blackEmoji.arrow} **Action:** \`${doc?.action}\`\n` +
        `${blackEmoji.arrow} **Whitelisted:** ${doc?.whitelist?.length || 0} bots`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'reset') {
      await Antibot.deleteOne({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Anti-Bot settings have been **reset**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} Unknown subcommand. Use \`${p}antibot\` to see all options.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};
