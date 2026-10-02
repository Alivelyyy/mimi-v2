const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Boost = require('@db/boostSchema.js');

module.exports = {
  name: 'boostdisable',
  aliases: ['bdis', 'boostoff'],
  cooldown: '',
  category: 'boost',
  usage: '',
  description: 'Disable boost messages for this server',
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
      const doc = await Boost.findOneAndUpdate(
        { guildId: message.guild.id },
        { enabled: false, updatedAt: new Date() },
        { new: true }
      );

      if (!doc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No boost message was set up for this server.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Boost messages have been **disabled**.\nUse \`${client.prefix}setboost #channel\` to re-enable.`
      ));
      await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
