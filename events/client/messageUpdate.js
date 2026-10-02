const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const GuildLogs = require('@db/guildLogs.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'messageUpdate',
  run: async (client, oldMessage, newMessage) => {
    if (!oldMessage || !newMessage) return;
    if (!oldMessage.guild || !newMessage.guild) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    if (!oldMessage.content && !newMessage.content) return;

    try {
      const logsDoc = await GuildLogs.findOne({ guildId: newMessage.guild.id });
      const logChannelId = logsDoc?.channels?.messages;
      if (!logChannelId) return;

      const logChannel = newMessage.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const oldContent = oldMessage.content?.slice(0, 500);
      const newContent = newMessage.content?.slice(0, 500);

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.message} Message Edited\n` +
        `${blackEmoji.user} **Author:** ${newMessage.author.tag} (\`${newMessage.author.id}\`)\n` +
        `${blackEmoji.channel} **Channel:** <#${newMessage.channel.id}>\n\n` +
        `**Before:**\n${oldContent}\n\n` +
        `**After:**\n${newContent}\n\n` +
        `${blackEmoji.link} [Jump to Message](${newMessage.url})\n` +
        `${blackEmoji.time} <t:${Math.floor(Date.now() / 1000)}:F>`
      ));
      logChannel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (_) {}
  }
};
