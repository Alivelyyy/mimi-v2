const { AuditLogEvent, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { handleAction } = require('../../plugins/antinuke.js');
const GuildLogs = require('@db/guildLogs.js');
const blackEmoji = require('@assets/emojis/black.js');

const typeNames = { 0: 'Text', 2: 'Voice', 4: 'Category', 5: 'Announcement', 13: 'Stage', 15: 'Forum' };

module.exports = {
  name: 'channelDelete',
  run: async (client, channel) => {
    try {
      const guild = channel.guild;
      if (!guild) return;
      await handleAction(client, guild, AuditLogEvent.ChannelDelete, 'antichanneldelete', 'Anti-Channel Delete \u2014 Mass channel deletion', null);
    } catch (_) {}

    try {
      const guild = channel.guild;
      if (!guild) return;

      const logsDoc = await GuildLogs.findOne({ guildId: guild.id });
      const logChannelId = logsDoc?.channels?.server;
      if (!logChannelId) return;

      const logChannel = guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.delete} Channel Deleted\n` +
        `${blackEmoji.channel} **Name:** #${channel.name}\n` +
        `${blackEmoji.info} **Type:** ${typeNames[channel.type] || channel.type}\n` +
        (channel.parent ? `${blackEmoji.arrow} **Category:** ${channel.parent.name}\n` : '') +
        `${blackEmoji.time} <t:${Math.floor(Date.now() / 1000)}:F>`
      ));
      logChannel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (_) {}
  },
};
