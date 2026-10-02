const Playlist = require("@db/playlistSchema.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const load = require("lodash");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "plpubliclist",
  aliases: ['plpub', 'publicplaylists'],
  category: "playlist",
  usage: "",
  description: "Browse all public playlists shared by users",
  args: false,
  premium: true,

  execute: async (client, message) => {
    try {
      const publicPlaylists = await Playlist.find({ isPublic: true })
        .sort({ createdAt: -1 })
        .lean();

      if (!publicPlaylists?.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.website} Public Playlists`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No public playlists found\n` +
          `${blackEmoji.arrow} Make yours public with \`${client.prefix}plprivacy <name>\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const displayPlaylists = publicPlaylists.map((pl, i) => {
        const user = client.users.cache.get(pl.userId);
        const username = user?.username || "Unknown";
        const trackCount = pl.tracks?.length || 0;
        const code = pl.shareCode ? `\`${pl.shareCode}\`` : "*(no code)*";
        return `${blackEmoji.arrow} \`${i + 1}.\` **${pl.name}** by ${username}\n   ${blackEmoji.music} ${trackCount} tracks • ${blackEmoji.link} ${code}`;
      });

      const perPage = 8;
      const chunks = load.chunk(displayPlaylists, perPage);

      const createPage = (chunk, pageIndex) => {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.website} Public Playlists`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk.join("\n\n")));
        c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} Page ${pageIndex + 1}/${chunks.length} • \`${client.prefix}plplayshared <code>\` to play`
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
        new ButtonBuilder().setCustomId("plp_first").setLabel("First").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId("plp_prev").setLabel("Previous").setStyle(ButtonStyle.Primary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId("plp_next").setLabel("Next").setStyle(ButtonStyle.Primary).setDisabled(page === chunks.length - 1),
        new ButtonBuilder().setCustomId("plp_last").setLabel("Last").setStyle(ButtonStyle.Secondary).setDisabled(page === chunks.length - 1)
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
          case "plp_first": currentPage = 0; break;
          case "plp_prev": currentPage = Math.max(0, currentPage - 1); break;
          case "plp_next": currentPage = Math.min(chunks.length - 1, currentPage + 1); break;
          case "plp_last": currentPage = chunks.length - 1; break;
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
      console.error("Error in plpubliclist:", error);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Error`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} An error occurred while fetching public playlists`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
