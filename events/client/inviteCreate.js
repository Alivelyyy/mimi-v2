module.exports = {
  name: 'inviteCreate',
  run: async (client, invite) => {
    try {
      if (!client.inviteCache) client.inviteCache = new Map();
      const guildId = invite.guild?.id;
      if (!guildId) return;

      if (!client.inviteCache.has(guildId)) {
        client.inviteCache.set(guildId, new Map());
      }
      client.inviteCache.get(guildId).set(invite.code, {
        uses: invite.uses || 0,
        inviterId: invite.inviter?.id
      });
    } catch (_) {}
  }
};
