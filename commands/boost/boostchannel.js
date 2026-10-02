const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Boost = require('@db/boostSchema.js');

module.exports = {
  name: 'boostchannel',
  aliases: ['bch', 'boostch'],
  cooldown: '',
  category: 'boost',
  usage: '<#channel>',
  description: 'Change the boost message channel',
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

    const doc = await Boost.findOne({ guildId: message.guild.id });
    if (!doc) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No boost message configured. Use \`${client.prefix}setboost #channel\` first.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    await Boost.updateOne({ guildId: message.guild.id }, { $set: { channelId: channel.id, updatedAt: new Date() } });
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Boost message channel updated to ${channel}.`));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
