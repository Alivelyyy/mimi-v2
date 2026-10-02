const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');
const { getUserData, formatListeningTime } = require('@utils/userData');

module.exports = {
  name: "history",
  aliases: ['hist', 'recent'],
  cooldown: "5",
  category: "information",
  usage: "[user]",
  description: "View your recently listened songs and full song history",
  args: false,
  vote: false,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const targetId = message.mentions.users.first()?.id || args[0] || message.author.id;
    const user = await client.users.fetch(targetId).catch(() => null);

    if (!user) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.cross} Invalid user provided`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const userData = getUserData(user.id, user.username);
    const lastFive = userData.lastFiveSongs || [];
    const songHistory = userData.songHistory || {};

    // Sort song history by count descending
    const topSongs = Object.values(songHistory)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Build recent page
    const recentContainer = new ContainerBuilder();
    recentContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.music} ${user.username}'s Music History`)
    );
    recentContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    if (lastFive.length === 0) {
      recentContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${blackEmoji.track} Last 5 Songs\n> ${blackEmoji.cross} No songs listened to yet`
        )
      );
    } else {
      const recentList = lastFive.map((song, i) => {
        const timeAgo = `<t:${Math.floor(song.listenedAt / 1000)}:R>`;
        const title = song.uri ? `[${song.title.substring(0, 50)}](${song.uri})` : song.title.substring(0, 50);
        return `> **${i + 1}.** ${title}\n> ${blackEmoji.user} ${song.author} • ${timeAgo}`;
      }).join('\n');
      recentContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${blackEmoji.track} Last 5 Songs\n${recentList}`)
      );
    }

    recentContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    recentContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.stats} Quick Stats\n` +
        `> ${blackEmoji.music} **Total Songs:** \`${(userData.totalSongsListened || 0).toLocaleString()}\`\n` +
        `> ${blackEmoji.time} **Time Listened:** \`${formatListeningTime(userData.totalListeningTimeMs || 0)}\`\n` +
        `> ${blackEmoji.data} **Unique Songs:** \`${Object.keys(songHistory).length.toLocaleString()}\``
      )
    );

    const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('history_recent').setLabel('Recent').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('history_top').setLabel('Most Played').setStyle(ButtonStyle.Secondary)
    );
    recentContainer.addActionRowComponents(navRow);

    // Build top songs page
    const topContainer = new ContainerBuilder();
    topContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} ${user.username}'s Top Songs`)
    );
    topContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    if (topSongs.length === 0) {
      topContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${blackEmoji.music} Most Played\n> ${blackEmoji.cross} No songs in history yet`
        )
      );
    } else {
      const topList = topSongs.map((song, i) => {
        const medal = i === 0 ? blackEmoji.medal1 : i === 1 ? blackEmoji.medal2 : i === 2 ? blackEmoji.medal3 : `**${i + 1}.**`;
        const title = song.uri ? `[${song.title.substring(0, 45)}](${song.uri})` : song.title.substring(0, 45);
        return `> ${medal} ${title}\n> ${blackEmoji.user} ${song.author} • ${blackEmoji.loop} Played **${song.count}x**`;
      }).join('\n');
      topContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${blackEmoji.music} Most Played (Top 10)\n${topList}`)
      );
    }

    const navRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('history_recent').setLabel('Recent').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('history_top').setLabel('Most Played').setStyle(ButtonStyle.Primary)
    );
    topContainer.addActionRowComponents(navRow2);

    const pages = { recent: recentContainer, top: topContainer };
    let currentPage = 'recent';

    const response = await message.reply({
      components: [pages[currentPage]],
      flags: MessageFlags.IsComponentsV2
    });

    const collector = response.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 60000,
      idle: 30000
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();
      if (interaction.customId === 'history_recent') currentPage = 'recent';
      if (interaction.customId === 'history_top') currentPage = 'top';
      await response.edit({ components: [pages[currentPage]], flags: MessageFlags.IsComponentsV2 });
    });

    collector.on('end', () => {
      const finalContainer = new ContainerBuilder();
      finalContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.music} ${user.username}'s Music History\n*Interaction timed out*`)
      );
      response.edit({ components: [finalContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  }
};
