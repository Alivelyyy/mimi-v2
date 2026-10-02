const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { J2CChannel } = require('@db/join2create.js');
const { refreshJ2CPanel } = require('@utils/j2cPanel.js');

module.exports = {
  name: 'j2ctransfer',
  aliases: ['j2ct', 'transfervc'],
  cooldown: '',
  category: 'join2create',
  usage: '<@user>',
  description: 'Transfer ownership of your Join-to-Create channel to another user',
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

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid member.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (target.id === message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You already own this channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const channel = message.guild.channels.cache.get(vcDoc.channelId);
    if (!channel) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Your channel no longer exists.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (!target.voice.channel || target.voice.channelId !== vcDoc.channelId) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} **${target.user.tag}** must be in your channel to transfer ownership.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await channel.permissionOverwrites.edit(target.user, {
        ManageChannels: true,
        MoveMembers: true,
        Connect: true,
        Speak: true
      });

      await channel.permissionOverwrites.edit(message.author, {
        ManageChannels: null,
        MoveMembers: null,
        Connect: true,
        Speak: true
      });

      await J2CChannel.updateOne({ _id: vcDoc._id }, { ownerId: target.id });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.yes} Ownership Transferred\n` +
        `${blackEmoji.arrow} **${target.user.tag}** is now the owner of **${channel.name}**.`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      await refreshJ2CPanel(message.guild, vcDoc.channelId);
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to transfer: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
