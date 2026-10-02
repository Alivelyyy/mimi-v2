const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const ExtraOwner = require('@db/extraowner.js');

  module.exports = {
    name: 'ignore2',
    aliases: ['ig2', 'ignorecmd'],
    cooldown: '',
    category: 'permit',
    usage: '<command|channel|user|bypass> <add|remove|show>',
    description: 'Manage command/channel/user ignoring',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: ['ManageGuild'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const type = args[0]?.toLowerCase();
      const action = args[1]?.toLowerCase();

      if (type === 'command') {
        if (action === 'add') {
          const cmd = args[2]?.toLowerCase();
          if (!cmd) {
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}ignore2 command add <cmdName>\``));
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
          }
          await ExtraOwner.findOneAndUpdate({ guildId: message.guild.id }, {
            $push: { ignoredCommands: { commandName: cmd, type: 'channel', id: message.channel.id } },
            $set: { updatedAt: new Date() }
          }, { upsert: true });
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Command \`${cmd}\` is now ignored in this channel.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (action === 'remove') {
          const cmd = args[2]?.toLowerCase();
          if (!cmd) {
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}ignore2 command remove <cmdName>\``));
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
          }
          await ExtraOwner.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { ignoredCommands: { commandName: cmd } } });
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Command \`${cmd}\` is no longer ignored.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (action === 'show') {
          const doc = await ExtraOwner.findOne({ guildId: message.guild.id });
          const cmds = doc?.ignoredCommands || [];
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Ignored Commands\n\n${cmds.length ? cmds.map((ic, i) => `${blackEmoji.arrow} ${i + 1}. \`${ic.commandName}\``).join('\n') : `${blackEmoji.info} None`}`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
      }

      if (type === 'channel') {
        if (action === 'add') {
          const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
          if (!ch) {
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a channel.`));
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
          }
          await ExtraOwner.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { ignoredChannels: ch.id }, $set: { updatedAt: new Date() } }, { upsert: true });
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${ch} is now ignored.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (action === 'remove') {
          const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
          if (!ch) {
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a channel.`));
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
          }
          await ExtraOwner.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { ignoredChannels: ch.id } });
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${ch} is no longer ignored.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (action === 'show') {
          const doc = await ExtraOwner.findOne({ guildId: message.guild.id });
          const chs = doc?.ignoredChannels || [];
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Ignored Channels\n\n${chs.length ? chs.map(id => `${blackEmoji.arrow} <#${id}>`).join('\n') : `${blackEmoji.info} None`}`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
      }

      if (type === 'user') {
        if (action === 'add') {
          const user = message.mentions.users.first();
          if (!user) {
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a user.`));
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
          }
          await ExtraOwner.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { ignoredUsers: user.id }, $set: { updatedAt: new Date() } }, { upsert: true });
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${user} is now ignored.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (action === 'remove') {
          const user = message.mentions.users.first() || await client.users.fetch(args[2]).catch(() => null);
          if (!user) {
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a user to remove.`));
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
          }
          await ExtraOwner.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { ignoredUsers: user.id } });
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${user} is no longer ignored.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (action === 'show') {
          const doc = await ExtraOwner.findOne({ guildId: message.guild.id });
          const users = doc?.ignoredUsers || [];
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Ignored Users\n\n${users.length ? users.map(id => `${blackEmoji.arrow} <@${id}>`).join('\n') : `${blackEmoji.info} None`}`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
      }

      if (type === 'bypass') {
        if (action === 'add') {
          const user = message.mentions.users.first();
          if (!user) {
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a user.`));
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
          }
          await ExtraOwner.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { bypassUsers: user.id }, $set: { updatedAt: new Date() } }, { upsert: true });
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${user} now bypasses ignore rules.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (action === 'remove') {
          const user = message.mentions.users.first() || await client.users.fetch(args[2]).catch(() => null);
          if (!user) {
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a user to remove.`));
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
          }
          await ExtraOwner.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { bypassUsers: user.id } });
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${user} no longer bypasses ignore rules.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (action === 'show') {
          const doc = await ExtraOwner.findOne({ guildId: message.guild.id });
          const users = doc?.bypassUsers || [];
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Bypass Users\n\n${users.length ? users.map(id => `${blackEmoji.arrow} <@${id}>`).join('\n') : `${blackEmoji.info} None`}`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.ignore} Ignore System\n\n` +
        `${blackEmoji.arrow} \`${client.prefix}ignore2 command <add|remove|show>\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}ignore2 channel <add|remove|show>\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}ignore2 user <add|remove|show>\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}ignore2 bypass <add|remove|show>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  