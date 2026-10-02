const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Leave = require('@db/leaveSchema.js');

module.exports = {
  name: 'leavemessage',
  aliases: ['lmsg', 'leavemsg'],
  cooldown: '',
  category: 'leave',
  usage: '<message>',
  description: 'Change the leave message text',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const doc = await Leave.findOne({ guildId: message.guild.id });
    if (!doc) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No leave message configured. Use \`${client.prefix}setleave #channel\` first.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const newMsg = args.join(' ');
    if (!newMsg) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide a message.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    await Leave.updateOne({ guildId: message.guild.id }, { $set: { message: newMsg, updatedAt: new Date() } });

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Leave Message Updated`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.message} **New Message:**\n${newMsg}\n\n` +
      `${blackEmoji.info} **Placeholders:** \`{user}\`, \`{username}\`, \`{server}\`, \`{count}\`\n` +
      `Test with \`${client.prefix}leavetest\`.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
