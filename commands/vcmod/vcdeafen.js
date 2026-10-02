const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'vcdeafen',
  aliases: ['vcd', 'vcdf'],
  cooldown: '',
  category: 'vcmod',
  usage: '<@user> [reason]',
  description: 'Server deafen a member in voice channel',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ['DeafenMembers'],
  userPerms: ['DeafenMembers'],
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

    if (!target.voice.channel) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} **${target.user.tag}** is not in a voice channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const reason = args.slice(1).join(' ');

    try {
      await target.voice.setDeaf(true, `${message.author.tag}: ${reason}`);

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Voice Deafened`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${target.user.tag}\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to deafen: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
