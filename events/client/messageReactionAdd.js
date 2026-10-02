const ReactionRole = require('@db/reactionRoles.js');

module.exports = {
  name: 'messageReactionAdd',
  run: async (client, reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch { return; }
    }

    const { message } = reaction;
    if (!message.guild) return;

    const emojiKey = reaction.emoji.id
      ? `<${reaction.emoji.animated ? 'a' : ''}:${reaction.emoji.name}:${reaction.emoji.id}>`
      : reaction.emoji.name;

    let doc = await ReactionRole.findOne({
      guildId: message.guild.id,
      messageId: message.id,
      emoji: emojiKey
    }).catch(() => null);

    if (!doc && reaction.emoji.id) {
      doc = await ReactionRole.findOne({
        guildId: message.guild.id,
        messageId: message.id,
        emoji: `${reaction.emoji.name}:${reaction.emoji.id}`
      }).catch(() => null);
    }

    if (!doc && reaction.emoji.id) {
      doc = await ReactionRole.findOne({
        guildId: message.guild.id,
        messageId: message.id,
        emoji: reaction.emoji.id
      }).catch(() => null);
    }

    if (!doc) return;

    const role = message.guild.roles.cache.get(doc.roleId) || await message.guild.roles.fetch(doc.roleId).catch(() => null);
    if (!role) return;

    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    await member.roles.add(role).catch(() => {});
  }
};
