const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const GuildLogs = require('@db/guildLogs.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "messageDelete",
  run: async (client, message) => {
    if (!message || !message.id) return;
    if (!message.author) return;
    if (!message.channel || !message.channel.id) return;
    if (!message.content && !message.attachments.size) return;

    const channelId = message.channel.id;

    client.snipes.set(channelId, {
      content: message.content,
      author: message.author,
      image: message.attachments.first()?.proxyURL || null,
      createdAt: new Date()
    });

    setTimeout(() => {
      const snipe = client.snipes.get(channelId);
      if (snipe) client.snipes.delete(channelId);
    }, 300000);

    if (!message.guild || message.author?.bot) return;
    try {
      const logsDoc = await GuildLogs.findOne({ guildId: message.guild.id });
      const logChannelId = logsDoc?.channels?.messages;
      if (!logChannelId) return;

      const logChannel = message.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.delete} Message Deleted\n` +
        `${blackEmoji.user} **Author:** ${message.author.tag} (\`${message.author.id}\`)\n` +
        `${blackEmoji.channel} **Channel:** <#${message.channel.id}>\n` +
        `${blackEmoji.message} **Content:** ${message.content?.slice(0, 1000)}\n` +
        (message.attachments.size ? `${blackEmoji.files} **Attachments:** ${message.attachments.size}\n` : '') +
        `${blackEmoji.time} <t:${Math.floor(Date.now() / 1000)}:F>`
      ));
      logChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (_) {}
  }
};
