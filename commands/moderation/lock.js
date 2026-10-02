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
  name: 'lock',
  aliases: ['lk', 'lockchannel'],
  cooldown: '',
  category: 'moderation',
  usage: '[#channel] [reason]',
  description: 'Lock a channel so members cannot send messages',
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
        SendMessages: false
      }, { reason: `${message.author.tag}: ${reason}` });

      const caseId = await logModAction(message.guild, 'lock', {
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason,
        extra: `**Channel:** <#${channel.id}>`
      });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Channel Locked`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.channel} **Channel:** ${channel}\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}\n` +
        `${blackEmoji.list} **Case:** #${caseId}\n\n` +
        `Members can no longer send messages in this channel.`
      ));

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to lock channel: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
