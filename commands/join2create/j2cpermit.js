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
  name: 'j2cpermit',
  aliases: ['j2cp', 'vcpermit'],
  cooldown: '',
  category: 'join2create',
  usage: '<@user>',
  description: 'Permit a user to join your locked Join-to-Create channel',
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

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid member.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const channel = message.guild.channels.cache.get(vcDoc.channelId);
    if (!channel) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Your channel no longer exists.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await channel.permissionOverwrites.edit(target.user, { Connect: true });

      if (!vcDoc.permittedUsers.includes(target.id)) {
        await J2CChannel.findByIdAndUpdate(vcDoc._id, { $addToSet: { permittedUsers: target.id } });
      }

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} **${target.user.tag}** can now join **${channel.name}** even if it's locked.`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to permit: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
