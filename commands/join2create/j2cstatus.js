const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { J2CChannel } = require('@db/join2create.js');

module.exports = {
  name: 'j2cstatus',
  aliases: ['j2cst', 'vcstatus'],
  cooldown: '',
  category: 'join2create',
  usage: '<status text | clear>',
  description: 'Set a status message for your Join-to-Create channel',
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

    const channel = message.guild.channels.cache.get(vcDoc.channelId);
    if (!channel) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Your channel no longer exists.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const statusText = args.join(' ');

    if (statusText.toLowerCase() === 'clear') {
      try {
        await channel.setStatus('').catch(() => {});
        await J2CChannel.updateOne({ _id: vcDoc._id }, { status: null });

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.yes} Channel status cleared for **${channel.name}**.`
        ));
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (err) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to clear status: ${err.message}`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
    }

    if (statusText.length > 500) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Status must be **500 characters** or less.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await channel.setStatus(statusText).catch(() => {});
      await J2CChannel.updateOne({ _id: vcDoc._id }, { status: statusText });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Channel status set to: **${statusText}**`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to set status: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
