module.exports = async (client) => {
  try {
    let mcount = 0;
    let gcount = client.guilds.cache.size;
    client.guilds.cache.forEach((g) => {
      mcount += g.memberCount;
    });

    try {
      client.inviteCache = new Map();
      for (const [guildId, guild] of client.guilds.cache) {
        try {
          const invites = await guild.invites.fetch();
          const cache = new Map();
          invites.forEach(inv => cache.set(inv.code, { uses: inv.uses, inviterId: inv.inviter?.id }));
          client.inviteCache.set(guildId, cache);
        } catch (_) {}
      }
    } catch (_) {}

    const { startLeaderboardScheduler } = require('@utils/lbScheduler.js');
    startLeaderboardScheduler(client);

    // Start Lavalink node health monitor (auto-reconnects dropped nodes)
    require('@functions/nodeHealthCheck.js')(client);

    let eventsSize = {};
    let commandsSize = {};
    [
      eventsSize.client,
      eventsSize.node,
      eventsSize.player,
      eventsSize.custom,
      commandsSize.message,
    ] = await Promise.all([
      await require("@loaders/clientEvents.js")(client),
      await require("@loaders/nodeEvents")(client),
      await require("@loaders/playerEvents")(client),
      await require("@loaders/customEvents.js")(client),
      await require("@loaders/commands.js")(client),
    ]);

    client.invite = {
      required: `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=37080065&scope=bot`,
      admin: `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`,
    };

    const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    const voteContainer = new ContainerBuilder();
    
    voteContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# Enjoying Music with me?`)
    );
    
    voteContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    
    voteContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `If yes, consider voting for me to support development!`
      )
    );
    
    voteContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    
    voteContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Vote Now')
          .setURL(client.vote || `https://top.gg/bot/${client.user.id}/vote`)
          .setStyle(ButtonStyle.Link)
      )
    );
    
    voteContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    
    voteContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`*Thank you for using ${client.user.username}!*`)
    );
    
    client.endEmbed = voteContainer;

    client.log(
      `Loaded ` +
        ` Client: ${eventsSize.client} ` +
        ` Node: ${eventsSize.node} ` +
        ` Player: ${eventsSize.player} ` +
        ` Custom: ${eventsSize.custom} `,
      "event"
    );
    client.log(`Loaded ` + ` Message: ${commandsSize.message} `, "cmd");
    client.log(`Ready for ${gcount} Servers | ${mcount} Users`, "ready");

    try {
      const Giveaway = require('@db/giveaway.js');
      const { MessageFlags } = require('discord.js');
      const overdueGiveaways = await Giveaway.find({ ended: false, endsAt: { $lte: new Date() } });
      for (const g of overdueGiveaways) {
        try {
          const guild = client.guilds.cache.get(g.guildId);
          if (!guild) continue;
          const channel = guild.channels.cache.get(g.channelId);
          if (!channel) continue;
          const msg = await channel.messages.fetch(g.messageId).catch(() => null);
          const reaction = msg?.reactions.cache.get('\u{1f389}');
          const users = reaction ? await reaction.users.fetch() : new Map();
          const entries = users.filter(u => !u.bot).map(u => u.id);
          const winners = [];
          const pool = [...entries];
          for (let i = 0; i < g.winners && pool.length > 0; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            winners.push(pool.splice(idx, 1)[0]);
          }
          g.ended = true;
          g.entries = entries;
          g.winnerIds = winners;
          await g.save();
          const endC = new ContainerBuilder();
          endC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# \u{1f3c6} GIVEAWAY ENDED\n\n**Prize:** ${g.prize}\n**Winner(s):** ${winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries'}`
          ));
          channel.send({ components: [endC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        } catch (e) {}
      }
      const pendingGiveaways = await Giveaway.find({ ended: false, endsAt: { $gt: new Date() } });
      for (const g of pendingGiveaways) {
        const remaining = g.endsAt.getTime() - Date.now();
        setTimeout(async () => {
          try {
            const giveaway = await Giveaway.findOne({ messageId: g.messageId });
            if (!giveaway || giveaway.ended) return;
            const guild = client.guilds.cache.get(g.guildId);
            if (!guild) return;
            const channel = guild.channels.cache.get(g.channelId);
            if (!channel) return;
            const msg = await channel.messages.fetch(g.messageId).catch(() => null);
            const reaction = msg?.reactions.cache.get('\u{1f389}');
            const users = reaction ? await reaction.users.fetch() : new Map();
            const entries = users.filter(u => !u.bot).map(u => u.id);
            const winners = [];
            const pool = [...entries];
            for (let i = 0; i < g.winners && pool.length > 0; i++) {
              const idx = Math.floor(Math.random() * pool.length);
              winners.push(pool.splice(idx, 1)[0]);
            }
            giveaway.ended = true;
            giveaway.entries = entries;
            giveaway.winnerIds = winners;
            await giveaway.save();
            const endC = new ContainerBuilder();
            endC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
              `# \u{1f3c6} GIVEAWAY ENDED\n\n**Prize:** ${g.prize}\n**Winner(s):** ${winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries'}`
            ));
            channel.send({ components: [endC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
          } catch (e) {}
        }, remaining);
      }
    } catch (e) {}
  } catch (error) {
    // Handle RestError and other errors gracefully
    if (error.code === 'ENOENT' || error.name === 'RestError') {
      client.log(`Non-critical error during ready event: ${error.message}`, "warn");
    } else {
      client.log(`Error in handleReadyEvent: ${error.message}`, "error");
      console.error(error);
    }
  }
};