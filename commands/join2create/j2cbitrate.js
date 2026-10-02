const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { J2CChannel } = require('@db/join2create.js');

module.exports = {
  name: 'j2cbitrate',
  aliases: ['j2cbr', 'vcbr'],
  cooldown: '',
  category: 'join2create',
  usage: '<8-384>',
  description: 'Set the bitrate (audio quality) for your Join-to-Create channel in kbps',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageChannels'], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const vcDoc = await J2CChannel.findOne({ guildId: message.guild.id, ownerId: message.author.id });
    if (!vcDoc) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You don't own a Join-to-Create channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const bitrate = parseInt(args[0]);
    const maxBitrate = Math.floor(message.guild.maximumBitrate / 1000);
    if (isNaN(bitrate) || bitrate < 8 || bitrate > maxBitrate) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Please provide a bitrate between **8** and **${maxBitrate}** kbps.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const channel = message.guild.channels.cache.get(vcDoc.channelId);
    if (!channel) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Your channel no longer exists.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await channel.setBitrate(bitrate * 1000, `J2C bitrate by ${message.author.tag}`);
      await J2CChannel.updateOne({ _id: vcDoc._id }, { bitrate: bitrate * 1000 });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Bitrate set to **${bitrate}kbps** for **${channel.name}**.`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to set bitrate: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
