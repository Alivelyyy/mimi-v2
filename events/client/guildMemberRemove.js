const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  AuditLogEvent,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Leave = require('@db/leaveSchema.js');
const { parseEmbeds } = require('@functions/embedParser.js');
const { handleAction, handleToggleAction } = require('../../plugins/antinuke.js');
const InviteTracker = require('@db/inviteTracker.js');
const LbSettings = require('@db/lbSettings.js');

module.exports = {
  name: 'guildMemberRemove',
  run: async (client, member) => {
    try {
      await handleAction(client, member.guild, AuditLogEvent.MemberKick, 'antikick', 'Anti-Kick — Mass kick detected', member.id);
    } catch (_) {}

    try {
      await handleToggleAction(client, member.guild, AuditLogEvent.MemberPrune, 'antiprune', 'Anti-Prune — Mass member prune detected', null);
    } catch (_) {}

    try {
      if (member.user.bot) return;

      const leaveDoc = await Leave.findOne({ guildId: member.guild.id, enabled: true });
      if (!leaveDoc) return;

      const channel = member.guild.channels.cache.get(leaveDoc.channelId);
      if (!channel || !channel.isTextBased()) return;

      const placeholders = { user: member.toString(), username: member.user.username, server: member.guild.name, count: member.guild.memberCount.toString() };
      const parsed = leaveDoc.message
        .replace(/{user}/g, placeholders.user)
        .replace(/{username}/g, placeholders.username)
        .replace(/{server}/g, placeholders.server)
        .replace(/{count}/g, placeholders.count);

      const { text: cleanText, embeds } = await parseEmbeds(parsed, member.guild.id, placeholders);

      if (embeds.length > 0) {
        const sendOpts = { embeds };
        if (cleanText) sendOpts.content = cleanText;
        await channel.send(sendOpts).catch(() => {});
      } else {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.bell} Goodbye!`));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(parsed));
        await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    } catch (err) {}

    // ── Leaves Log ─────────────────────────────────────────────────────────
    try {
      const GuildLogs = require('@db/guildLogs.js');
      const logsDoc = await GuildLogs.findOne({ guildId: member.guild.id });
      const logChannelId = logsDoc?.channels?.leaves;
      if (logChannelId) {
        const logChannel = member.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const joinedAt = member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown';
          const roles = member.roles?.cache?.filter(r => r.id !== member.guild.id).map(r => `<@&${r.id}>`).join(', ');
          const lc = new ContainerBuilder();
          lc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${blackEmoji.outbox} Member Left\n` +
            `**User:** ${member.user.tag} (<@${member.id}>)\n` +
            `**ID:** \`${member.id}\`\n` +
            `**Joined:** ${joinedAt}\n` +
            `**Roles:** ${roles.length > 900 ? roles.slice(0, 900) + '...' : roles}\n` +
            `**Member Count:** ${member.guild.memberCount}\n` +
            `<t:${Math.floor(Date.now() / 1000)}:F>`
          ));
          logChannel.send({ components: [lc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
      }
    } catch (_) {}

    try {
      const lbSettings = await LbSettings.findOne({ guildId: member.guild.id });
      if (lbSettings?.inviteLb) {
        const memberDoc = await InviteTracker.findOne({ guildId: member.guild.id, userId: member.id });
        if (memberDoc?.invitedBy) {
          const inviterDoc = await InviteTracker.findOne({ guildId: member.guild.id, userId: memberDoc.invitedBy });
          const wasReal = inviterDoc?.invitedUsers?.includes(member.id) && (inviterDoc?.regularInvites > 0);
          await InviteTracker.updateOne(
            { guildId: member.guild.id, userId: memberDoc.invitedBy },
            {
              $inc: {
                totalInvites: wasReal ? -1 : 0,
                regularInvites: wasReal ? -1 : 0,
                leftInvites: 1
              },
              $pull: { invitedUsers: member.id }
            }
          );
        }
      }
    } catch (_) {}
  }
};
