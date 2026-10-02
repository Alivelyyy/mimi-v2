const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { logModAction } = require('@utils/modLogger.js');

module.exports = {
  name: 'slowmode',
  aliases: ['sm', 'slow'],
  cooldown: '',
  category: 'moderation',
  usage: '<seconds 0-21600> [#channel]',
  description: 'Set slowmode for a channel (0 to disable)',
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
    const seconds = parseInt(args[0]);
    const channel = message.mentions.channels.first() || message.channel;

    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Provide a value between **0** and **21600** seconds (6 hours). Use 0 to disable.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await channel.setRateLimitPerUser(seconds, `Set by ${message.author.tag}`);

      await logModAction(message.guild, 'slowmode', {
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason: seconds === 0 ? 'Slowmode disabled' : `Slowmode set to ${seconds}s`,
        extra: `**Channel:** <#${channel.id}>`
      });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        seconds === 0
          ? `# ${blackEmoji.yes} Slowmode Disabled`
          : `# ${blackEmoji.yes} Slowmode Set`
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.channel} **Channel:** ${channel}\n` +
        `${blackEmoji.time} **Slowmode:** ${seconds === 0 ? 'Disabled' : `${seconds} second${seconds !== 1 ? 's' : ''}`}\n` +
        `${blackEmoji.mod} **Set by:** ${message.author.tag}`
      ));

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to set slowmode: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
