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
const { getAllUsersData, formatListeningTime } = require('@utils/userData');

function buildLeaderboardPage(title, entries, formatLine) {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} Leaderboard — ${title}`)
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );

  if (entries.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`> ${blackEmoji.cross} No data available yet`)
    );
  } else {
    const list = entries.map((entry, i) => {
      const medal = i === 0 ? blackEmoji.medal1 : i === 1 ? blackEmoji.medal2 : i === 2 ? blackEmoji.medal3 : `**${i + 1}.**`;
      return `> ${medal} **${entry.username}**\n> ${formatLine(entry)}`;
    }).join('\n');
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(list)
    );
  }

  return container;
}

module.exports = {
  name: "lb",
  aliases: ['songlb', 'topsongs'],
  cooldown: "5",
  category: "information",
  usage: "",
  description: "View the global leaderboards for songs, listening time, commands and playlists",
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
    const allData = getAllUsersData();
    const users = Object.values(allData).filter(u => u && u.username);

    // Sort by each stat
    const byListens = [...users].sort((a, b) => (b.totalSongsListened || 0) - (a.totalSongsListened || 0)).slice(0, 10);
    const byTime = [...users].sort((a, b) => (b.totalListeningTimeMs || 0) - (a.totalListeningTimeMs || 0)).slice(0, 10);
    const byCommands = [...users].sort((a, b) => (b.totalCommandsUsed || 0) - (a.totalCommandsUsed || 0)).slice(0, 10);
    const byPlaylists = [...users].sort((a, b) => (b.publicPlaylistsCount || 0) - (a.publicPlaylistsCount || 0)).filter(u => (u.publicPlaylistsCount || 0) > 0).slice(0, 10);

    const pages = {
      listens: buildLeaderboardPage(
        'Songs Listened',
        byListens,
        e => `${blackEmoji.music} **${(e.totalSongsListened || 0).toLocaleString()}** songs played`
      ),
      time: buildLeaderboardPage(
        'Listening Time',
        byTime,
        e => `${blackEmoji.time} **${formatListeningTime(e.totalListeningTimeMs || 0)}** listened`
      ),
      commands: buildLeaderboardPage(
        'Commands Used',
        byCommands,
        e => `${blackEmoji.data} **${(e.totalCommandsUsed || 0).toLocaleString()}** commands used`
      ),
      playlists: buildLeaderboardPage(
        'Public Playlists',
        byPlaylists,
        e => `${blackEmoji.playlist} **${(e.publicPlaylistsCount || 0).toLocaleString()}** public playlist${(e.publicPlaylistsCount || 0) !== 1 ? 's' : ''}`
      )
    };

    const pageOrder = ['listens', 'time', 'commands', 'playlists'];
    const pageLabels = { listens: 'Songs', time: 'Time', commands: 'Commands', playlists: 'Playlists' };
    let currentPage = 'listens';

    function buildNav(active) {
      const row = new ActionRowBuilder();
      pageOrder.forEach(p => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`lb_${p}`)
            .setLabel(pageLabels[p])
            .setStyle(active === p ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
      });
      return row;
    }

    function getPageWithNav(pageKey) {
      const container = pages[pageKey];
      container.addActionRowComponents(buildNav(pageKey));
      return container;
    }

    // Build fresh containers each time (clone style)
    function getContainer(pageKey) {
      const allData2 = getAllUsersData();
      const users2 = Object.values(allData2).filter(u => u && u.username);
      const byListens2 = [...users2].sort((a, b) => (b.totalSongsListened || 0) - (a.totalSongsListened || 0)).slice(0, 10);
      const byTime2 = [...users2].sort((a, b) => (b.totalListeningTimeMs || 0) - (a.totalListeningTimeMs || 0)).slice(0, 10);
      const byCommands2 = [...users2].sort((a, b) => (b.totalCommandsUsed || 0) - (a.totalCommandsUsed || 0)).slice(0, 10);
      const byPlaylists2 = [...users2].sort((a, b) => (b.publicPlaylistsCount || 0) - (a.publicPlaylistsCount || 0)).filter(u => (u.publicPlaylistsCount || 0) > 0).slice(0, 10);

      const dataMap = { listens: byListens2, time: byTime2, commands: byCommands2, playlists: byPlaylists2 };
      const titleMap = { listens: 'Songs Listened', time: 'Listening Time', commands: 'Commands Used', playlists: 'Public Playlists' };
      const formatMap = {
        listens: e => `${blackEmoji.music} **${(e.totalSongsListened || 0).toLocaleString()}** songs played`,
        time: e => `${blackEmoji.time} **${formatListeningTime(e.totalListeningTimeMs || 0)}** listened`,
        commands: e => `${blackEmoji.data} **${(e.totalCommandsUsed || 0).toLocaleString()}** commands used`,
        playlists: e => `${blackEmoji.playlist} **${(e.publicPlaylistsCount || 0).toLocaleString()}** public playlist${(e.publicPlaylistsCount || 0) !== 1 ? 's' : ''}`
      };

      const container = buildLeaderboardPage(titleMap[pageKey], dataMap[pageKey], formatMap[pageKey]);

      const row = new ActionRowBuilder();
      pageOrder.forEach(p => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`lb_${p}`)
            .setLabel(pageLabels[p])
            .setStyle(pageKey === p ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
      });
      container.addActionRowComponents(row);
      return container;
    }

    const response = await message.reply({
      components: [getContainer(currentPage)],
      flags: MessageFlags.IsComponentsV2
    });

    const collector = response.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 60000,
      idle: 30000
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();
      const newPage = interaction.customId.replace('lb_', '');
      if (pageOrder.includes(newPage)) {
        currentPage = newPage;
        await response.edit({ components: [getContainer(currentPage)], flags: MessageFlags.IsComponentsV2 });
      }
    });

    collector.on('end', () => {
      const finalContainer = new ContainerBuilder();
      finalContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} Leaderboard\n*Interaction timed out*`)
      );
      response.edit({ components: [finalContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  }
};
