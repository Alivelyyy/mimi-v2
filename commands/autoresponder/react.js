const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Autoreact = require('@db/autoreact.js');

module.exports = {
  name: 'react',
  aliases: ['autoreact', 'areact'],
  cooldown: '3',
  category: 'autoresponder',
  usage: '<add|remove|list|reset>',
  description: 'Auto-react to messages containing trigger words',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['AddReactions'], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();
    const p = client.prefix;

    if (!action) {
      const docs = await Autoreact.find({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.list} Autoreact System\n` +
        `${blackEmoji.arrow} Active Triggers: **${docs.length}**\n\n` +
        `### Commands\n` +
        `> \`${p}react add <trigger> <emoji>\` — Add emoji reaction\n` +
        `> \`${p}react remove <trigger>\` — Remove trigger\n` +
        `> \`${p}react list\` — View all triggers\n` +
        `> \`${p}react reset\` — Remove all triggers\n\n` +
        `${blackEmoji.info} When a message contains the trigger word, the bot auto-reacts with the configured emoji(s).`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'add') {
      const trigger = args[1]?.toLowerCase();
      const emoji = args[2];
      if (!trigger || !emoji) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${p}react add <trigger> <emoji>\`\n` +
          `${blackEmoji.arrow} Example: \`${p}react add hello ${blackEmoji.slap}\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const existing = await Autoreact.findOne({ guildId: message.guild.id, trigger });
      if (!existing) {
        const count = await Autoreact.countDocuments({ guildId: message.guild.id });
        if (count >= 30) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Maximum of **30** autoreact triggers reached.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
      }
      await Autoreact.findOneAndUpdate(
        { guildId: message.guild.id, trigger },
        { $addToSet: { emojis: emoji }, $setOnInsert: { createdBy: message.author.id } },
        { upsert: true }
      );
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Autoreact ${emoji} added for trigger \`${trigger}\`.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'remove' || action === 'delete' || action === 'del') {
      const trigger = args[1]?.toLowerCase();
      if (!trigger) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${p}react remove <trigger>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const res = await Autoreact.deleteOne({ guildId: message.guild.id, trigger });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        res.deletedCount ? `${blackEmoji.yes} Autoreact for \`${trigger}\` removed.` : `${blackEmoji.no} No autoreact found with trigger \`${trigger}\`.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'list') {
      const docs = await Autoreact.find({ guildId: message.guild.id });
      if (!docs.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} No autoreacts configured. Use \`${p}react add\` to add one.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const lines = docs.slice(0, 15).map((d, i) =>
        `> ${blackEmoji.arrow} ${i + 1}. \`${d.trigger}\` → ${d.emojis.join(' ')}`
      );
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.list} Autoreact Triggers (${docs.length})\n\n${lines.join('\n')}` +
        (docs.length > 15 ? `\n\n${blackEmoji.info} Showing 15 of ${docs.length}` : '')
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'reset') {
      const res = await Autoreact.deleteMany({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Removed **${res.deletedCount}** autoreact trigger(s).`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} Unknown subcommand. Use \`${p}react\` to see all options.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
