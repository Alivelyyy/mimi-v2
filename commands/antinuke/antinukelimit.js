const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Antinuke = require('@db/antinuke.js');
const { MODULE_INFO } = require('../../plugins/antinuke.js');

module.exports = {
  name: 'antinukelimit',
  aliases: ['anlimit', 'nukelimit'],
  cooldown: '5',
  category: 'antinuke',
  usage: '<module> <1-20>',
  description: 'Set the action threshold for an anti-nuke module',
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

    const modName = args[0]?.toLowerCase();
    const value = parseInt(args[1]);
    const limitModules = Object.entries(MODULE_INFO).filter(([, v]) => v.hasLimit).map(([k]) => k);

    if (!modName || isNaN(value) || !limitModules.includes(modName)) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.info} **Usage:** \`${client.prefix}antinukelimit <module> <1-20>\`\n\n` +
        `**Modules:** ${limitModules.map(k => `\`${k}\``).join(', ')}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (value < 1 || value > 20) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Limit must be between **1** and **20**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    await Antinuke.findOneAndUpdate(
      { guildId: message.guild.id },
      { $set: { [`modules.${modName}.limit`]: value, updatedAt: new Date() } },
      { upsert: true }
    );

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.yes} **${MODULE_INFO[modName].label}** limit set to \`${value}\`.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};
