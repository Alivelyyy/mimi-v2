const {
  ContainerBuilder,
  TextDisplayBuilder,
  PermissionsBitField,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { J2CChannel, J2CSetting } = require('@db/join2create.js');

module.exports = {
  name: 'j2creset',
  aliases: ['j2cr', 'vcresetall'],
  cooldown: '',
  category: 'join2create',
  usage: '',
  description: 'Reset your Join-to-Create channel to default settings',
  args: false,
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

    const j2cSetting = await J2CSetting.findOne({ guildId: message.guild.id });
    const defaultName = (j2cSetting?.defaultName || '{user}\'s Channel')
      .replace(/{user}/g, message.member.displayName)
      .replace(/{username}/g, message.author.username)
      .replace(/{tag}/g, message.author.tag);

    try {
      await channel.edit({
        name: defaultName,
        userLimit: j2cSetting?.defaultLimit || 0,
        bitrate: Math.min(j2cSetting?.defaultBitrate || 64000, message.guild.maximumBitrate),
        rtcRegion: j2cSetting?.defaultRegion || null
      });

      await channel.permissionOverwrites.set([
        {
          id: message.author.id,
          allow: [
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak
          ]
        },
        {
          id: message.guild.roles.everyone,
          allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel]
        }
      ]);

      await J2CChannel.updateOne({ _id: vcDoc._id }, {
        locked: false,
        hidden: false,
        bannedUsers: [],
        permittedUsers: [],
        bitrate: j2cSetting?.defaultBitrate || 64000,
        region: j2cSetting?.defaultRegion || null,
        status: null
      });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.yes} Channel Reset\n` +
        `${blackEmoji.arrow} **${channel.name}** has been reset to default settings.`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to reset: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
