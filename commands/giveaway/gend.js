const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const Giveaway = require('@db/giveaway.js');

  module.exports = {
    name: 'gend',
    aliases: ['giveawayend', 'gwend'],
    cooldown: '',
    category: 'giveaway',
    usage: '<messageId>',
    description: 'End a giveaway early',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['ManageMessages'], userPerms: ['ManageGuild'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const msgId = args[0];
      const giveaway = await Giveaway.findOne({ messageId: msgId, guildId: message.guild.id });
      if (!giveaway) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No giveaway found with that message ID.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      if (giveaway.ended) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This giveaway has already ended.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const channel = message.guild.channels.cache.get(giveaway.channelId);
      const fetchedMsg = channel ? await channel.messages.fetch(msgId).catch(() => null) : null;

      const reaction = fetchedMsg?.reactions.cache.get('\u{1f389}');
      const users = reaction ? await reaction.users.fetch() : new Map();
      const entries = users.filter(u => !u.bot).map(u => u.id);

      const winners = [];
      const pool = [...entries];
      for (let i = 0; i < giveaway.winners && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        winners.push(pool.splice(idx, 1)[0]);
      }

      giveaway.ended = true;
      giveaway.entries = entries;
      giveaway.winnerIds = winners;
      await giveaway.save();

      if (channel) {
        const endContainer = new ContainerBuilder();
        endContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} GIVEAWAY ENDED`));
        endContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        endContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Prize:** ${giveaway.prize}\n` +
          `${blackEmoji.arrow} **Winner(s):** ${winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries'}`
        ));
        channel.send({ components: [endContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Giveaway ended. Winner(s): ${winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'None'}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  