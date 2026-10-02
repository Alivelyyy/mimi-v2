const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ChannelType, PermissionsBitField } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Jail = require('@db/jail.js');
const { logModAction } = require('@utils/modLogger.js');

module.exports = {
  name: 'jail',
  aliases: ['prison', 'jailuser'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user|setup|list|config|reset> [reason]',
  description: 'Jail a user or manage jail system',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageRoles', 'ManageChannels'], userPerms: ['ManageRoles'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();

    if (action === 'setup') {
      let role = message.guild.roles.cache.find(r => r.name === 'Jailed');
      if (!role) {
        role = await message.guild.roles.create({ name: 'Jailed', color: '#36393f', permissions: [] });
      }
      let channel = message.guild.channels.cache.find(c => c.name === 'jail');
      if (!channel) {
        channel = await message.guild.channels.create({
          name: 'jail',
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: message.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
          ]
        });
      }
      message.guild.channels.cache.forEach(async ch => {
        if (ch.id !== channel.id) {
          await ch.permissionOverwrites.edit(role, { ViewChannel: false, SendMessages: false }).catch(() => {});
        }
      });
      await Jail.findOneAndUpdate({ guildId: message.guild.id }, { $set: { roleId: role.id, channelId: channel.id, updatedAt: new Date() } }, { upsert: true });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Jail System Setup`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Role:** ${role}\n` +
        `${blackEmoji.arrow} **Channel:** ${channel}\n\n` +
        `${blackEmoji.info} Use \`${client.prefix}jail @user [reason]\` to jail members.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'list') {
      const doc = await Jail.findOne({ guildId: message.guild.id });
      const jailed = doc?.jailedUsers || [];
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Jailed Users`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      if (jailed.length) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          jailed.map((j, i) => `**${i + 1}.** <@${j.userId}> — ${j.reason} \u2022 <t:${Math.floor(new Date(j.jailedAt).getTime() / 1000)}:R>`).join('\n')
        ));
      } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} No jailed users.`));
      }
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'config') {
      const doc = await Jail.findOne({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Jail Config`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Role:** ${doc?.roleId ? `<@&${doc.roleId}>` : 'Not set'}\n` +
        `${blackEmoji.arrow} **Channel:** ${doc?.channelId ? `<#${doc.channelId}>` : 'Not set'}\n` +
        `${blackEmoji.arrow} **Jailed:** ${doc?.jailedUsers?.length || 0}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'reset') {
      await Jail.deleteOne({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Jail system has been **reset**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!member) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} Jail System\n\n` +
        `${blackEmoji.arrow} \`${client.prefix}jail @user [reason]\` — Jail a member\n` +
        `${blackEmoji.arrow} \`${client.prefix}jail setup\` — Setup jail system\n` +
        `${blackEmoji.arrow} \`${client.prefix}jail list\` — View jailed users\n` +
        `${blackEmoji.arrow} \`${client.prefix}jail config\` — View configuration\n` +
        `${blackEmoji.arrow} \`${client.prefix}jail reset\` — Reset jail system`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const doc = await Jail.findOne({ guildId: message.guild.id });
    if (!doc?.roleId) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Jail not set up. Use \`${client.prefix}jail setup\` first.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (doc.jailedUsers.some(j => j.userId === member.id)) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} **${member.displayName}** is already jailed.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (member.id === message.author.id || member.id === client.user.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You cannot jail yourself or the bot.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const reason = args.slice(1).join(' ');
    const savedRoles = member.roles.cache.filter(r => r.id !== message.guild.id && r.editable).map(r => r.id);

    try {
      await member.roles.set([doc.roleId], `Jailed: ${reason}`);
      doc.jailedUsers.push({ userId: member.id, roles: savedRoles, reason });
      doc.updatedAt = new Date();
      await doc.save();

      const caseId = await logModAction(message.guild, 'jail', {
        targetId: member.id,
        targetTag: member.user.tag,
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason
      });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Member Jailed`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${member.user.tag} (\`${member.id}\`)\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}\n` +
        `${blackEmoji.list} **Case:** #${caseId}\n\n` +
        `${blackEmoji.arrow} Use \`${client.prefix}unjail @user\` to release.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to jail: ${err.message}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
