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
  name: 'unlock',
  aliases: ['ul', 'unlockchannel'],
  cooldown: '',
  category: 'moderation',
  usage: '[#channel] [reason]',
  description: 'Unlock a channel so members can send messages again',
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
    const channel = message.mentions.channels.first() || message.channel;
    const reason = args.filter(a => !a.startsWith('<#')).join(' ');

    try {
      const everyoneRole = message.guild.roles.everyone;
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null
      }, { reason: `${message.author.tag}: ${reason}` });

      const caseId = await logModAction(message.guild, 'unlock', {
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason,
        extra: `**Channel:** <#${channel.id}>`
      });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Channel Unlocked`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.channel} **Channel:** ${channel}\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}\n` +
        `${blackEmoji.list} **Case:** #${caseId}\n\n` +
        `Members can now send messages in this channel.`
      ));

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to unlock channel: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
