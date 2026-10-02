const { AuditLogEvent, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { handleAction } = require('../../plugins/antinuke.js');
const GuildLogs = require('@db/guildLogs.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'roleDelete',
  run: async (client, role) => {
    try {
      const guild = role.guild;
      if (!guild) return;
      await handleAction(client, guild, AuditLogEvent.RoleDelete, 'antiroledelete', 'Anti-Role Delete \u2014 Mass role deletion', null);
    } catch (_) {}

    try {
      const guild = role.guild;
      if (!guild) return;

      const logsDoc = await GuildLogs.findOne({ guildId: guild.id });
      const logChannelId = logsDoc?.channels?.server;
      if (!logChannelId) return;

      const logChannel = guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.delete} Role Deleted\n` +
        `${blackEmoji.arrow} **Name:** ${role.name}\n` +
        `${blackEmoji.info} **Color:** ${role.hexColor}\n` +
        `${blackEmoji.time} <t:${Math.floor(Date.now() / 1000)}:F>`
      ));
      logChannel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (_) {}
  },
};
