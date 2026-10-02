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
  name: 'leavetest',
  aliases: ['lt', 'testleave'],
  cooldown: '',
  category: 'leave',
  usage: '',
  description: 'Send a test leave message to the configured channel',
  args: false,
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
    try {
      const doc = await Leave.findOne({ guildId: message.guild.id });

      if (!doc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} No leave message configured. Use \`${client.prefix}setleave #channel\` first.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const channel = message.guild.channels.cache.get(doc.channelId);
      if (!channel) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} The configured leave channel no longer exists.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const parsed = doc.message
        .replace(/{user}/g, message.author.toString())
        .replace(/{username}/g, message.author.username)
        .replace(/{server}/g, message.guild.name)
        .replace(/{count}/g, message.guild.memberCount.toString());

      const leaveContainer = new ContainerBuilder();
      leaveContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.bell} Goodbye!`));
      leaveContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      leaveContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(parsed));
      leaveContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      leaveContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`*— Test message sent by ${message.author.tag}*`));

      await channel.send({ components: [leaveContainer], flags: MessageFlags.IsComponentsV2 });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Test leave message sent to ${channel}.`));
      await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
