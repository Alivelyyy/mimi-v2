const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const Giveaway = require('@db/giveaway.js');

  module.exports = {
    name: 'gstart',
    aliases: ['gw', 'giveaway'],
    cooldown: '',
    category: 'giveaway',
    usage: '<time> <winners> <prize>',
    description: 'Start a giveaway',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['ManageMessages'], userPerms: ['ManageGuild'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const timeStr = args[0];
      const winnersCount = parseInt(args[1]);
      const prize = args.slice(2).join(' ');

      if (!timeStr || isNaN(winnersCount) || !prize) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}gstart <time: 1m/1h/1d> <winners> <prize>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const timeMatch = timeStr.match(/(\d+)(s|m|h|d)/);
      if (!timeMatch) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Invalid time format. Use \`1m\`, \`1h\`, \`1d\`, etc.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
      const duration = parseInt(timeMatch[1]) * multipliers[timeMatch[2]];
      const endsAt = new Date(Date.now() + duration);

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} GIVEAWAY`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Prize:** ${prize}\n` +
        `${blackEmoji.arrow} **Winners:** ${winnersCount}\n` +
        `${blackEmoji.arrow} **Hosted by:** ${message.author}\n` +
        `${blackEmoji.arrow} **Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>\n\n` +
        `React with \u{1f389} to enter!`
      ));

      const msg = await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
      await msg.react('\u{1f389}');

      await Giveaway.create({
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: msg.id,
        hostId: message.author.id,
        prize,
        winners: winnersCount,
        endsAt
      });

      setTimeout(async () => {
        try {
          const giveaway = await Giveaway.findOne({ messageId: msg.id });
          if (!giveaway || giveaway.ended) return;

          const fetchedMsg = await message.channel.messages.fetch(msg.id).catch(() => null);
          if (!fetchedMsg) return;

          const reaction = fetchedMsg.reactions.cache.get('\u{1f389}');
          const users = reaction ? await reaction.users.fetch() : new Map();
          const entries = users.filter(u => !u.bot).map(u => u.id);

          const winners = [];
          const pool = [...entries];
          for (let i = 0; i < winnersCount && pool.length > 0; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            winners.push(pool.splice(idx, 1)[0]);
          }

          giveaway.ended = true;
          giveaway.entries = entries;
          giveaway.winnerIds = winners;
          await giveaway.save();

          const endContainer = new ContainerBuilder();
          endContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} GIVEAWAY ENDED`));
          endContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
          endContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} **Prize:** ${prize}\n` +
            `${blackEmoji.arrow} **Winner(s):** ${winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries'}\n` +
            `${blackEmoji.arrow} **Entries:** ${entries.length}`
          ));
          message.channel.send({ components: [endContainer], flags: MessageFlags.IsComponentsV2 });
        } catch (e) {}
      }, duration);

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Giveaway started!`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  