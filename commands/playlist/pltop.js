const Playlist = require("@db/playlistSchema.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const load = require("lodash");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "pltop",
  aliases: ['plt', 'topplaylists'],
  category: "playlist",
  usage: "[global|server]",
  description: "View the top playlist creators leaderboard",
  args: false,
  premium: true,

  execute: async (client, message, args) => {
    try {
      const scope = args[0]?.toLowerCase();
      const isServerScope = scope === "server" || scope === "guild";

      const userStats = await Playlist.aggregate([
        {
          $group: {
            _id: "$userId",
            playlistCount: { $sum: 1 },
            totalTracks: { $sum: { $size: "$tracks" } },
            publicPlaylists: { $sum: { $cond: [{ $eq: ["$isPublic", true] }, 1, 0] } },
          },
        },
        { $match: { playlistCount: { $gt: 0 } } },
        { $sort: { totalTracks: -1 } },
      ]);

      if (!userStats?.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} Playlist Leaderboard`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No playlists have been created yet\n` +
          `${blackEmoji.arrow} Be the first! Use \`${client.prefix}plcreate <name>\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const filteredStats = [];
      for (const stat of userStats) {
        if (isServerScope && !message.guild.members.cache.get(stat._id)) continue;
        const user = client.users.cache.get(stat._id);
        if (user) {
          filteredStats.push({
            userId: stat._id,
            username: user.username,
            playlistCount: stat.playlistCount,
            totalTracks: stat.totalTracks,
            publicPlaylists: stat.publicPlaylists,
          });
        }
      }

      if (!filteredStats.length) {
        const scopeText = isServerScope ? "this server" : "globally";
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} Playlist Leaderboard`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No playlists found ${scopeText}\n` +
          `${blackEmoji.arrow} Create one with \`${client.prefix}plcreate <name>\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const medals = [blackEmoji.medal1, blackEmoji.medal2, blackEmoji.medal3];
      const formattedStats = filteredStats.map((user, i) => {
        const medal = i < 3 ? medals[i] : `\`${i + 1}.\``;
        return `${medal} **${user.username}**\n${blackEmoji.arrow} ${user.totalTracks} tracks • ${user.playlistCount} playlists • ${user.publicPlaylists} public`;
      });

      const usersPerPage = 10;
      const chunks = load.chunk(formattedStats, usersPerPage);
      const scopeLabel = isServerScope ? message.guild.name : "Global";

      const createPage = (chunk, pageIndex) => {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} ${scopeLabel} Leaderboard`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk.join("\n\n")));
        c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} Page ${pageIndex + 1}/${chunks.length} • Ranked by total tracks`
        ));
        return c;
      };

      if (chunks.length === 1) {
        return message.reply({
          components: [createPage(chunks[0], 0)],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      let currentPage = 0;
      const getRow = (page) => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("plt_first").setLabel("First").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId("plt_prev").setLabel("Previous").setStyle(ButtonStyle.Primary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId("plt_next").setLabel("Next").setStyle(ButtonStyle.Primary).setDisabled(page === chunks.length - 1),
        new ButtonBuilder().setCustomId("plt_last").setLabel("Last").setStyle(ButtonStyle.Secondary).setDisabled(page === chunks.length - 1)
      );

      const pageC = createPage(chunks[currentPage], currentPage);
      pageC.addActionRowComponents(getRow(currentPage));

      const msg = await message.reply({ components: [pageC], flags: MessageFlags.IsComponentsV2 });

      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 60000,
        componentType: ComponentType.Button,
      });

      collector.on("collect", async (interaction) => {
        switch (interaction.customId) {
          case "plt_first": currentPage = 0; break;
          case "plt_prev": currentPage = Math.max(0, currentPage - 1); break;
          case "plt_next": currentPage = Math.min(chunks.length - 1, currentPage + 1); break;
          case "plt_last": currentPage = chunks.length - 1; break;
        }
        const updatedC = createPage(chunks[currentPage], currentPage);
        updatedC.addActionRowComponents(getRow(currentPage));
        await interaction.update({ components: [updatedC], flags: MessageFlags.IsComponentsV2 });
      });

      collector.on("end", async () => {
        const finalC = createPage(chunks[currentPage], currentPage);
        await msg.edit({ components: [finalC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      });
    } catch (error) {
      console.error("Error in pltop:", error);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Error`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} An error occurred while fetching the leaderboard`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
