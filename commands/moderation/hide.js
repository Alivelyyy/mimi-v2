const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { logModAction } = require('@utils/modLogger.js');

module.exports = {
  name: 'hide',
  aliases: ['hc', 'hidechannel'],
  cooldown: '',
  category: 'moderation',
  usage: '[#channel] [reason]',
  description: 'Hide a channel from everyone',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageChannels'], userPerms: ['ManageChannels'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const channel = message.mentions.channels.first() || message.channel;
    const reason = args.filter(a => !a.startsWith('<#')).join(' ');

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: false }, { reason: `${message.author.tag}: ${reason}` });

      const caseId = await logModAction(message.guild, 'hide', {
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason,
        extra: `**Channel:** <#${channel.id}>`
      });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Channel Hidden`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.channel} **Channel:** ${channel}\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}\n` +
        `${blackEmoji.list} **Case:** #${caseId}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to hide channel: ${err.message}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
