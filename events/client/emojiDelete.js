const { AuditLogEvent, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { handleAction } = require('../../plugins/antinuke.js');
const GuildLogs = require('@db/guildLogs.js');

module.exports = {
  name: 'emojiDelete',
  run: async (client, emoji) => {
    try {
      const guild = emoji.guild;
      if (!guild) return;
      await handleAction(client, guild, AuditLogEvent.EmojiDelete, 'antiemoji', 'Anti-Emoji — Mass emoji deletion', null);
    } catch (_) {}

    try {
      const guild = emoji.guild;
      if (!guild) return;

      const logsDoc = await GuildLogs.findOne({ guildId: guild.id });
      const logChannelId = logsDoc?.channels?.server;
      if (!logChannelId) return;

      const logChannel = guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const blackEmoji = require('@assets/emojis/black.js');
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.delete} Emoji Deleted\n` +
        `**Name:** \`:${emoji.name}:\`\n` +
        `**ID:** \`${emoji.id}\`\n` +
        `**Animated:** ${emoji.animated ? 'Yes' : 'No'}\n` +
        `<t:${Math.floor(Date.now() / 1000)}:F>`
      ));
      logChannel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (_) {}
  },
};
