const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Leave = require('@db/leaveSchema.js');

module.exports = {
  name: 'setleave',
  aliases: ['sl', 'leavesetup'],
  cooldown: '',
  category: 'leave',
  usage: '<#channel> [message]',
  description: 'Set up leave messages when members leave',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: ['ManageGuild'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

    if (!channel || !channel.isTextBased()) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Please mention a valid text channel.\n` +
        `Usage: \`${client.prefix}setleave #channel [custom message]\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const customMsg = args.slice(1).filter(a => !a.startsWith('<#')).join(' ') ||
      '**{username}** has left **{server}**. We now have {count} members.';

    try {
      await Leave.findOneAndUpdate(
        { guildId: message.guild.id },
        { guildId: message.guild.id, channelId: channel.id, message: customMsg, enabled: true, updatedAt: new Date() },
        { upsert: true, new: true }
      );

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Leave Messages Setup`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.channel} **Channel:** ${channel}\n` +
        `${blackEmoji.message} **Message:** ${customMsg}\n\n` +
        `${blackEmoji.info} **Available placeholders:**\n` +
        `${blackEmoji.arrow} \`{user}\` — Mentions the member (may not resolve)\n` +
        `${blackEmoji.arrow} \`{username}\` — Member's username\n` +
        `${blackEmoji.arrow} \`{server}\` — Server name\n` +
        `${blackEmoji.arrow} \`{count}\` — Total member count\n` +
        `${blackEmoji.arrow} \`{embed:name}\` — Include a custom embed\n\n` +
        `Test with \`${client.prefix}leavetest\`.`
      ));

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
