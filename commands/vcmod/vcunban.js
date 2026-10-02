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
  name: 'vcunban',
  aliases: ['vcub', 'vcunblock2'],
  cooldown: '',
  category: 'vcmod',
  usage: '<@user> [#channel]',
  description: 'Unban a user from a voice channel',
  args: true,
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
    const target = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);

    if (!target) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid user.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const targetChannel = message.mentions.channels.first()?.type === 2 ? message.mentions.channels.first() : null;

    if (!targetChannel) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a voice channel (e.g. \`${client.prefix}vcunban @user #channel\`).`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      const ban = await VcBans.findOneAndDelete({ guildId: message.guild.id, channelId: targetChannel.id, userId: target.id });

      if (!ban) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} **${target.tag}** is not VC banned from **${targetChannel.name}**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await targetChannel.permissionOverwrites.delete(target, 'VC Unban').catch(() => {});

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Voice Channel Unbanned`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${target.tag}\n` +
        `${blackEmoji.channel} **Channel:** ${targetChannel.name}\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to VC unban: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
