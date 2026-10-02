const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Antinuke = require('@db/antinuke.js');

module.exports = {
  name: 'antinukepunishment',
  aliases: ['anpunish', 'nukepunish'],
  cooldown: '5',
  category: 'antinuke',
  usage: '<ban|kick|strip|quarantine>',
  description: 'Set the punishment for anti-nuke violations',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['Administrator'], userPerms: ['Administrator'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    if (message.guild.ownerId !== message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Only the **server owner** can manage anti-nuke.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const val = args[0]?.toLowerCase();
    if (!['ban', 'kick', 'strip', 'quarantine'].includes(val)) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.info} **Usage:** \`${client.prefix}antinukepunishment <ban|kick|strip|quarantine>\`\n\n` +
        `> **ban** — Ban the offender\n` +
        `> **kick** — Kick the offender\n` +
        `> **strip** — Remove all roles\n` +
        `> **quarantine** — Strip roles + assign quarantine role`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    await Antinuke.findOneAndUpdate(
      { guildId: message.guild.id },
      { $set: { punishment: val, updatedAt: new Date() } },
      { upsert: true }
    );

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.yes} Anti-nuke punishment set to **${val}**.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};
