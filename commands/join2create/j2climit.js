const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { J2CChannel } = require('@db/join2create.js');

module.exports = {
  name: 'j2climit',
  aliases: ['j2cl', 'vclimit'],
  cooldown: '',
  category: 'join2create',
  usage: '<0-99>',
  description: 'Set user limit for your Join-to-Create channel (0 = unlimited)',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ['ManageChannels'],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const vcDoc = await J2CChannel.findOne({ guildId: message.guild.id, ownerId: message.author.id });

    if (!vcDoc) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You don't own a Join-to-Create channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const limit = parseInt(args[0]);
    if (isNaN(limit) || limit < 0 || limit > 99) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide a number between **0** and **99** (0 = unlimited).`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const channel = message.guild.channels.cache.get(vcDoc.channelId);
    if (!channel) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Your channel no longer exists.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await channel.setUserLimit(limit, `J2C limit by ${message.author.tag}`);

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} User limit set to **${limit === 0 ? 'Unlimited' : limit}** for **${channel.name}**.`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to set limit: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
