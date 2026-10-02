const { AuditLogEvent, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { handleAction } = require('../../plugins/antinuke.js');
const GuildLogs = require('@db/guildLogs.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'guildBanAdd',
  run: async (client, ban) => {
    try {
      await handleAction(client, ban.guild, AuditLogEvent.MemberBanAdd, 'antiban', 'Anti-Ban \u2014 Mass ban detected', ban.user?.id);
    } catch (_) {}

    try {
      const logsDoc = await GuildLogs.findOne({ guildId: ban.guild.id });
      const logChannelId = logsDoc?.channels?.moderation;
      if (!logChannelId) return;

      const logChannel = ban.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.warn} Member Banned\n` +
        `${blackEmoji.user} **User:** ${ban.user.tag} (\`${ban.user.id}\`)\n` +
        `${blackEmoji.info} **Reason:** ${ban.reason}\n` +
        `${blackEmoji.time} <t:${Math.floor(Date.now() / 1000)}:F>`
      ));
      logChannel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (_) {}
  },
};
