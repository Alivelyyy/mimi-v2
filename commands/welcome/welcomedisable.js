const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Welcome = require('@db/welcomeSchema.js');

module.exports = {
  name: 'welcomedisable',
  aliases: ['wd', 'welcomeoff'],
  cooldown: '',
  category: 'welcome',
  usage: '',
  description: 'Disable welcome messages for this server',
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: ['ManageGuild'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    try {
      const doc = await Welcome.findOneAndUpdate(
        { guildId: message.guild.id },
        { enabled: false, updatedAt: new Date() },
        { new: true }
      );

      if (!doc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No welcome message was set up for this server.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Welcome messages have been **disabled**.\nUse \`${client.prefix}setwelcome #channel\` to re-enable.`
      ));
      await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
