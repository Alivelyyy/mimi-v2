module.exports = {
  name: 'inviteDelete',
  run: async (client, invite) => {
    try {
      if (!client.inviteCache) return;
      const guildId = invite.guild?.id;
      if (!guildId) return;

      const guildCache = client.inviteCache.get(guildId);
      if (guildCache) {
        guildCache.delete(invite.code);
      }
    } catch (_) {}
  }
};
