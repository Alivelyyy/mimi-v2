const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const VanityRoles = require('@db/vanityRoles.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'presenceUpdate',
  run: async (client, oldPresence, newPresence) => {
    try {
      if (!newPresence?.guild || !newPresence?.member) return;
      if (newPresence.member.user.bot) return;

      const guild = newPresence.guild;
      const member = newPresence.member;

      const doc = await VanityRoles.findOne({ guildId: guild.id, enabled: true });
      if (!doc || !doc.roleId || !doc.vanityUrls?.length) return;

      const role = guild.roles.cache.get(doc.roleId);
      if (!role) return;

      const hasVanity = checkPresenceForVanity(newPresence, doc.vanityUrls);
      const hasRole = member.roles.cache.has(role.id);

      if (hasVanity && !hasRole) {
        try {
          await member.roles.add(role, 'Vanity role — user added vanity to status');
        } catch { return; }

        await VanityRoles.updateOne(
          { guildId: guild.id },
          { $addToSet: { trackedUsers: member.id } }
        );

        if (doc.channelId) {
          const channel = guild.channels.cache.get(doc.channelId);
          if (channel) {
            const msg = formatMessage(doc.welcomeMessage, member, guild, role);
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${msg}`));
            channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
          }
        }
      } else if (!hasVanity && hasRole) {
        try {
          await member.roles.remove(role, 'Vanity role — user removed vanity from status');
        } catch { return; }

        await VanityRoles.updateOne(
          { guildId: guild.id },
          { $pull: { trackedUsers: member.id } }
        );

        if (doc.channelId) {
          const channel = guild.channels.cache.get(doc.channelId);
          if (channel) {
            const msg = formatMessage(doc.removeMessage, member, guild, role);
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} ${msg}`));
            channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
          }
        }
      } else if (hasVanity && hasRole) {
        if (!doc.trackedUsers?.includes(member.id)) {
          await VanityRoles.updateOne(
            { guildId: guild.id },
            { $addToSet: { trackedUsers: member.id } }
          );
        }
      } else if (!hasVanity && !hasRole) {
        if (doc.trackedUsers?.includes(member.id)) {
          await VanityRoles.updateOne(
            { guildId: guild.id },
            { $pull: { trackedUsers: member.id } }
          );
        }
      }
    } catch (_) {}
  }
};

function checkPresenceForVanity(presence, vanityUrls) {
  if (!presence?.activities?.length) return false;

  for (const activity of presence.activities) {
    const textToCheck = [
      activity.state,
      activity.details,
      activity.name,
      activity.url
    ].filter(Boolean).join(' ').toLowerCase();

    for (const vanity of vanityUrls) {
      if (textToCheck.includes(vanity.toLowerCase())) return true;
    }
  }

  return false;
}

function formatMessage(template, member, guild, role) {
  if (!template) return '';
  return template
    .replace(/\{user\}/g, `${member}`)
    .replace(/\{username\}/g, member.user.username)
    .replace(/\{server\}/g, guild.name)
    .replace(/\{role\}/g, `${role}`);
}
