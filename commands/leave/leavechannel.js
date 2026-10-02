const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Leave = require('@db/leaveSchema.js');

module.exports = {
  name: 'leavechannel',
  aliases: ['lch', 'leavech'],
  cooldown: '',
  category: 'leave',
  usage: '<#channel>',
  description: 'Change the leave message channel',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!channel || !channel.isTextBased()) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid text channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const doc = await Leave.findOne({ guildId: message.guild.id });
    if (!doc) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No leave message configured. Use \`${client.prefix}setleave #channel\` first.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    await Leave.updateOne({ guildId: message.guild.id }, { $set: { channelId: channel.id, updatedAt: new Date() } });
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Leave message channel updated to ${channel}.`));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
