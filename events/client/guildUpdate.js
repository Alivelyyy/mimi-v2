const { AuditLogEvent, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { handleToggleAction } = require('../../plugins/antinuke.js');
const GuildLogs = require('@db/guildLogs.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'guildUpdate',
  run: async (client, oldGuild, newGuild) => {
    try {
      const changed = oldGuild.name !== newGuild.name ||
        oldGuild.iconURL() !== newGuild.iconURL() ||
        oldGuild.bannerURL() !== newGuild.bannerURL() ||
        oldGuild.vanityURLCode !== newGuild.vanityURLCode;

      if (!changed) return;

      await handleToggleAction(client, newGuild, AuditLogEvent.GuildUpdate, 'antiserverupdate', 'Anti-Server Update \u2014 Server settings modified', null);
    } catch (_) {}

    try {
      const logsDoc = await GuildLogs.findOne({ guildId: newGuild.id });
      const logChannelId = logsDoc?.channels?.server;
      if (!logChannelId) return;

      const logChannel = newGuild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const changes = [];
      if (oldGuild.name !== newGuild.name) changes.push(`${blackEmoji.arrow} **Name:** \`${oldGuild.name}\` \u2192 \`${newGuild.name}\``);
      if (oldGuild.iconURL() !== newGuild.iconURL()) changes.push(`${blackEmoji.arrow} **Icon:** Changed`);
      if (oldGuild.bannerURL() !== newGuild.bannerURL()) changes.push(`${blackEmoji.arrow} **Banner:** Changed`);
      if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) changes.push(`${blackEmoji.arrow} **Vanity URL:** \`${oldGuild.vanityURLCode}\` \u2192 \`${newGuild.vanityURLCode}\``);
      if (oldGuild.verificationLevel !== newGuild.verificationLevel) changes.push(`${blackEmoji.arrow} **Verification Level:** ${oldGuild.verificationLevel} \u2192 ${newGuild.verificationLevel}`);
      if (oldGuild.systemChannelId !== newGuild.systemChannelId) changes.push(`${blackEmoji.arrow} **System Channel:** Changed`);

      if (changes.length === 0) return;

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} Server Updated\n${changes.join('\n')}\n${blackEmoji.time} <t:${Math.floor(Date.now() / 1000)}:F>`
      ));
      logChannel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (_) {}
  },
};
