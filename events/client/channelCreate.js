const { AuditLogEvent, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { handleAction } = require('../../plugins/antinuke.js');
const GuildLogs = require('@db/guildLogs.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'channelCreate',
  run: async (client, channel) => {
    try {
      const guild = channel.guild;
      if (!guild) return;
      await handleAction(client, guild, AuditLogEvent.ChannelCreate, 'antichannelcreate', 'Anti-Channel Create — Mass channel creation', null);
    } catch (_) {}

    try {
      const guild = channel.guild;
      if (!guild) return;

      const logsDoc = await GuildLogs.findOne({ guildId: guild.id });
      const logChannelId = logsDoc?.channels?.server;
      if (!logChannelId) return;

      const logChannel = guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const typeNames = { 0: 'Text', 2: 'Voice', 4: 'Category', 5: 'Announcement', 13: 'Stage', 15: 'Forum' };
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.plus} Channel Created\n` +
        `**Name:** ${channel.name}\n` +
        `**Type:** ${typeNames[channel.type] || channel.type}\n` +
        `**Category:** ${channel.parent?.name}\n` +
        `<t:${Math.floor(Date.now() / 1000)}:F>`
      ));
      logChannel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (_) {}
  },
};
