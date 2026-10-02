const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const Giveaway = require('@db/giveaway.js');

  module.exports = {
    name: 'greroll',
    aliases: ['gwr', 'reroll'],
    cooldown: '',
    category: 'giveaway',
    usage: '<messageId>',
    description: 'Reroll a giveaway winner',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['ManageMessages'], userPerms: ['ManageGuild'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const giveaway = await Giveaway.findOne({ messageId: args[0], guildId: message.guild.id });
      if (!giveaway || !giveaway.ended) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No ended giveaway found with that message ID.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const pool = giveaway.entries.filter(id => !giveaway.winnerIds.includes(id));
      if (!pool.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No remaining entries to reroll from.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      const winner = pool[Math.floor(Math.random() * pool.length)];
      giveaway.winnerIds.push(winner);
      await giveaway.save();
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.trophy} New winner: <@${winner}>! Congratulations!`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  