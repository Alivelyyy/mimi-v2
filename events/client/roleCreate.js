const { AuditLogEvent, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { handleAction } = require('../../plugins/antinuke.js');
const GuildLogs = require('@db/guildLogs.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'roleCreate',
  run: async (client, role) => {
    try {
      const guild = role.guild;
      if (!guild) return;
      await handleAction(client, guild, AuditLogEvent.RoleCreate, 'antirolecreate', 'Anti-Role Create — Mass role creation', null);
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
        `# ${blackEmoji.plus} Role Created\n` +
        `**Name:** ${role.name}\n` +
        `**Color:** ${role.hexColor}\n` +
        `**Mentionable:** ${role.mentionable ? 'Yes' : 'No'}\n` +
        `**Hoisted:** ${role.hoist ? 'Yes' : 'No'}\n` +
        `<t:${Math.floor(Date.now() / 1000)}:F>`
      ));
      logChannel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (_) {}
  },
};
