const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const Playlist = require("@db/playlistSchema.js");
const load = require("lodash");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "pllist",
  aliases: ['pll', 'myplaylists'],
  category: "playlist",
  usage: "",
  description: "List all your playlists with track counts and privacy status",
  premium: true,

  execute: async (client, message) => {
    try {
      const userPlaylists = await Playlist.find({ userId: message.author.id })
        .sort({ createdAt: -1 })
        .lean();

      if (!userPlaylists?.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.playlist} Your Playlists`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} You don't have any playlists yet\n` +
          `${blackEmoji.arrow} Create one with \`${client.prefix}plcreate <name>\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      let totalTracks = 0;
      const formattedPlaylists = userPlaylists.map((pl, i) => {
        const trackCount = pl.tracks?.length || 0;
        totalTracks += trackCount;
        const privacyIcon = pl.isPublic ? blackEmoji.website : blackEmoji.lock;
        const privacyText = pl.isPublic ? "Public" : "Private";
        return `${blackEmoji.arrow} \`${i + 1}.\` **${pl.name}** — ${trackCount} track(s) | ${privacyIcon} ${privacyText}`;
      });

      const playlistsPerPage = 10;
      const chunks = load.chunk(formattedPlaylists, playlistsPerPage);

      const createPage = (chunk, pageIndex) => {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.playlist} ${message.author.username}'s Playlists`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk.join("\n")));
        c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.list} **Total:** ${userPlaylists.length}/25 playlists • ${totalTracks} tracks\n` +
          `${blackEmoji.info} Page ${pageIndex + 1}/${chunks.length}`
        ));
        return c;
      };

      if (chunks.length === 1) {
        const c = createPage(chunks[0], 0);
        c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} \`${client.prefix}plview <name>\` to see tracks\n` +
          `${blackEmoji.arrow} \`${client.prefix}plplay <name>\` to play a playlist`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      let currentPage = 0;
      const getRow = (page) => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pl_first").setLabel("First").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId("pl_prev").setLabel("Previous").setStyle(ButtonStyle.Primary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId("pl_next").setLabel("Next").setStyle(ButtonStyle.Primary).setDisabled(page === chunks.length - 1),
        new ButtonBuilder().setCustomId("pl_last").setLabel("Last").setStyle(ButtonStyle.Secondary).setDisabled(page === chunks.length - 1)
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
          case "pl_first": currentPage = 0; break;
          case "pl_prev": currentPage = Math.max(0, currentPage - 1); break;
          case "pl_next": currentPage = Math.min(chunks.length - 1, currentPage + 1); break;
          case "pl_last": currentPage = chunks.length - 1; break;
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
      console.error("Error in pllist:", error);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Error`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} An error occurred while fetching your playlists`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
