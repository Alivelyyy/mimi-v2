const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ChannelType,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'vcunlock',
  aliases: ['vcul', 'unlockvoice'],
  cooldown: '',
  category: 'vcmod',
  usage: '[#voicechannel]',
  description: 'Unlock a voice channel so members can join',
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ['ManageChannels'],
  userPerms: ['ManageChannels'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const targetChannel = message.mentions.channels.first()
      || message.member.voice.channel;

    if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Please mention a voice channel or join one first.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await targetChannel.permissionOverwrites.edit(message.guild.roles.everyone, {
        Connect: null
      }, { reason: `VC Unlock by ${message.author.tag}` });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Voice Channel Unlocked`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.channel} **Channel:** ${targetChannel.name}\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `Members can now join this voice channel.`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to unlock VC: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
