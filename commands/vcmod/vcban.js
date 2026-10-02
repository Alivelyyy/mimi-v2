const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const VcBans = require('@db/vcBans.js');

module.exports = {
  name: 'vcban',
  aliases: ['vb', 'vcblock2'],
  cooldown: '',
  category: 'vcmod',
  usage: '<@user> [#channel] [reason]',
  description: 'Ban a user from joining a specific voice channel',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ['ManageChannels', 'MoveMembers'],
  userPerms: ['ManageChannels'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!target) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid member.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const targetChannel = message.mentions.channels.first()?.type === 2
      ? message.mentions.channels.first()
      : target.voice.channel;

    if (!targetChannel) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a voice channel or the user must be in one.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const reason = args.filter(a => !a.startsWith('<')).join(' ');

    try {
      await VcBans.findOneAndUpdate(
        { guildId: message.guild.id, channelId: targetChannel.id, userId: target.id },
        { guildId: message.guild.id, channelId: targetChannel.id, userId: target.id, moderatorId: message.author.id, reason, bannedAt: new Date() },
        { upsert: true }
      );

      await targetChannel.permissionOverwrites.edit(target.user, {
        Connect: false
      }, { reason: `VC Ban by ${message.author.tag}: ${reason}` });

      if (target.voice.channelId === targetChannel.id) {
        await target.voice.disconnect('VC Banned').catch(() => {});
      }

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Voice Channel Banned`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${target.user.tag}\n` +
        `${blackEmoji.channel} **Channel:** ${targetChannel.name}\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to VC ban: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
