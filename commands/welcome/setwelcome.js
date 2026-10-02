const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Welcome = require('@db/welcomeSchema.js');

module.exports = {
  name: 'setwelcome',
  aliases: ['sw', 'welcomeset'],
  cooldown: '',
  category: 'welcome',
  usage: '<#channel> [message]',
  description: 'Set up welcome messages when members join',
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
        `Usage: \`${client.prefix}setwelcome #channel [custom message]\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const customMsg = args.slice(1).filter(a => !a.startsWith('<#')).join(' ') ||
      'Welcome {user} to **{server}**! You are member #{count}.';

    try {
      await Welcome.findOneAndUpdate(
        { guildId: message.guild.id },
        { guildId: message.guild.id, channelId: channel.id, message: customMsg, enabled: true, updatedAt: new Date() },
        { upsert: true, new: true }
      );

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Welcome Messages Setup`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.channel} **Channel:** ${channel}\n` +
        `${blackEmoji.message} **Message:** ${customMsg}\n\n` +
        `${blackEmoji.info} **Available placeholders:**\n` +
        `${blackEmoji.arrow} \`{user}\` — Mentions the new member\n` +
        `${blackEmoji.arrow} \`{username}\` — Member's username\n` +
        `${blackEmoji.arrow} \`{server}\` — Server name\n` +
        `${blackEmoji.arrow} \`{count}\` — Total member count\n` +
        `${blackEmoji.arrow} \`{embed:name}\` — Include a custom embed\n\n` +
        `Test with \`${client.prefix}welcometest\`.`
      ));

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
