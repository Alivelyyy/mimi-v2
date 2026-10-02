const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Media = require('@db/media.js');

module.exports = {
  name: 'media',
  aliases: ['med', 'attachments'],
  cooldown: '',
  category: 'utility',
  usage: '<setup|remove|config|bypass>',
  description: 'Setup media-only channels',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageMessages'], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();

    if (action === 'setup') {
      const channel = message.mentions.channels.first() || message.channel;
      await Media.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { enabled: true, channelId: channel.id, updatedAt: new Date() } },
        { upsert: true }
      );
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Media-only channel set to ${channel}.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'remove') {
      await Media.findOneAndUpdate({ guildId: message.guild.id }, { $set: { enabled: false } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Media-only channel has been **disabled**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'config') {
      const doc = await Media.findOne({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} Media Config\n\n` +
        `${blackEmoji.arrow} **Status:** ${doc?.enabled ? blackEmoji.on : blackEmoji.off}\n` +
        `${blackEmoji.arrow} **Channel:** ${doc?.channelId ? `<#${doc.channelId}>` : 'Not set'}\n` +
        `${blackEmoji.arrow} **Bypass Users:** ${doc?.bypassUsers?.length || 0}\n` +
        `${blackEmoji.arrow} **Bypass Roles:** ${doc?.bypassRoles?.length || 0}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'bypass') {
      const sub = args[1]?.toLowerCase();

      if (sub === 'add') {
        const user = message.mentions.users.first();
        const role = message.mentions.roles.first();
        if (user) {
          await Media.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { bypassUsers: user.id } }, { upsert: true });
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${user} can now bypass media-only.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (role) {
          await Media.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { bypassRoles: role.id } }, { upsert: true });
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${role} can now bypass media-only.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a **user** or **role** to add to the bypass list.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (sub === 'remove') {
        const user = message.mentions.users.first();
        const role = message.mentions.roles.first();
        if (!user && !role) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a **user** or **role** to remove from the bypass list.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        if (user) await Media.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { bypassUsers: user.id } });
        if (role) await Media.findOneAndUpdate({ guildId: message.guild.id }, { $pull: { bypassRoles: role.id } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Bypass removed.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (sub === 'show') {
        const doc = await Media.findOne({ guildId: message.guild.id });
        const users = doc?.bypassUsers?.length ? doc.bypassUsers.map(id => `<@${id}>`).join(', ') : 'None';
        const roles = doc?.bypassRoles?.length ? doc.bypassRoles.map(id => `<@&${id}>`).join(', ') : 'None';
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.list} Media Bypass\n\n` +
          `**Users:** ${users}\n` +
          `**Roles:** ${roles}`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Invalid bypass action. Use \`add\`, \`remove\`, or \`show\`.\n` +
        `${blackEmoji.arrow} \`${client.prefix}media bypass add @user/@role\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}media bypass remove @user/@role\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}media bypass show\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `# ${blackEmoji.cog} Media\n\n` +
      `${blackEmoji.arrow} \`${client.prefix}media setup [#channel]\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}media remove\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}media config\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}media bypass <add|remove|show> @user/@role\``
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
