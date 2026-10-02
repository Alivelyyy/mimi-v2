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
  name: 'j2cghost',
  aliases: ['ghost', 'hidevc'],
  cooldown: '',
  category: 'join2create',
  usage: '',
  description: 'Hide your Join-to-Create channel from the channel list',
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

    if (vcDoc.hidden) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Your channel is already hidden. Use \`${client.prefix}j2cunghost\` to make it visible.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: false });
      await J2CChannel.updateOne({ _id: vcDoc._id }, { hidden: true });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.yes} Channel Hidden\n` +
        `${blackEmoji.arrow} **${channel.name}** is now invisible to other members.`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      await refreshJ2CPanel(message.guild, vcDoc.channelId);
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to hide: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
