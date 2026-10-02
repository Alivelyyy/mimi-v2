const {
  ContainerBuilder,
  TextDisplayBuilder,
  PermissionsBitField,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { J2CChannel } = require('@db/join2create.js');
const { refreshJ2CPanel } = require('@utils/j2cPanel.js');

module.exports = {
  name: 'j2cclaim',
  aliases: ['j2cc', 'claimvc'],
  cooldown: '',
  category: 'join2create',
  usage: '',
  description: 'Claim ownership of a Join-to-Create channel when the owner has left',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageChannels'], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const memberVoice = message.member.voice.channel;
    if (!memberVoice) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You must be in a voice channel to claim it.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const vcDoc = await J2CChannel.findOne({ channelId: memberVoice.id });
    if (!vcDoc) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This is not a Join-to-Create channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (vcDoc.ownerId === message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You already own this channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const ownerInChannel = memberVoice.members.has(vcDoc.ownerId);
    if (ownerInChannel) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} The channel owner <@${vcDoc.ownerId}> is still in the channel. You cannot claim it.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await memberVoice.permissionOverwrites.edit(message.author, {
        ManageChannels: true,
        MoveMembers: true,
        Connect: true,
        Speak: true
      });

      try {
        await memberVoice.permissionOverwrites.delete(vcDoc.ownerId).catch(() => {});
      } catch (_) {}

      await J2CChannel.updateOne({ _id: vcDoc._id }, { ownerId: message.author.id });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.yes} Channel Claimed\n` +
        `${blackEmoji.arrow} You are now the owner of **${memberVoice.name}**.`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      await refreshJ2CPanel(message.guild, memberVoice.id);
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to claim: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
