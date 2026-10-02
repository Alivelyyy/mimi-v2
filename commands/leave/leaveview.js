const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Leave = require('@db/leaveSchema.js');

module.exports = {
  name: 'leaveview',
  aliases: ['lv', 'viewleave'],
  cooldown: '',
  category: 'leave',
  usage: '',
  description: 'View current leave message configuration',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message) => {
    const doc = await Leave.findOne({ guildId: message.guild.id });

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Leave Configuration`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    if (!doc) {
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.off} Leave messages are **not configured**.\n` +
        `Use \`${client.prefix}setleave #channel [message]\` to set up.`
      ));
    } else {
      const statusIcon = doc.enabled ? (blackEmoji.on) : (blackEmoji.off);
      const channelText = doc.channelId ? `<#${doc.channelId}>` : 'Not set';

      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${statusIcon} **Status:** ${doc.enabled ? 'Enabled' : 'Disabled'}\n` +
        `${blackEmoji.channel} **Channel:** ${channelText}\n` +
        `${blackEmoji.message} **Message:**\n\`\`\`${doc.message}\`\`\`\n` +
        `${blackEmoji.info} **Placeholders:** \`{user}\`, \`{username}\`, \`{server}\`, \`{count}\``
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} \`${client.prefix}leavechannel #ch\` — Change channel\n` +
        `${blackEmoji.arrow} \`${client.prefix}leavemessage <msg>\` — Change message\n` +
        `${blackEmoji.arrow} \`${client.prefix}leavedisable\` — Disable\n` +
        `${blackEmoji.arrow} \`${client.prefix}leavetest\` — Test`
      ));
    }

    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
