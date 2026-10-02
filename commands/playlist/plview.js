const Playlist = require("@db/playlistSchema.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const load = require("lodash");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "plview",
  aliases: ['plv', 'viewplaylist'],
  category: "playlist",
  usage: "<playlist name>",
  description: "View songs in a playlist with pagination",
  args: true,
  premium: true,

  execute: async (client, message, args) => {
    const playlistName = args.join(" ");

    if (!playlistName) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Missing Playlist Name`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Please provide a playlist name\n` +
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}plview <name>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const playlist = await Playlist.findOne({
      userId: message.author.id,
      name: playlistName
    });

    if (!playlist) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Playlist Not Found`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} You don't have a playlist named \`${playlistName}\`\n` +
        `${blackEmoji.arrow} Use \`${client.prefix}pllist\` to see your playlists`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const tracks = playlist.tracks || [];

    if (!tracks.length) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.playlist} ${playlistName}`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.music} **Tracks:** 0\n` +
        `${playlist.isPublic ? `${blackEmoji.website} **Public**` : `${blackEmoji.lock} **Private**`}`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} This playlist is empty\n` +
        `${blackEmoji.arrow} Add tracks with \`${client.prefix}pladd ${playlistName} <song>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    let totalDuration = 0;
    const formattedTracks = tracks.map((track, i) => {
      if (track.duration && !isNaN(track.duration)) totalDuration += track.duration;
      return `${blackEmoji.arrow} \`${i + 1}.\` [${track.title}](${track.uri}) (${formatDuration(track.duration)})`;
    });

    const tracksPerPage = 10;
    const chunks = load.chunk(formattedTracks, tracksPerPage);
    const privacyDisplay = playlist.isPublic ? `${blackEmoji.website} Public` : `${blackEmoji.lock} Private`;

    const createPage = (chunk, pageIndex) => {
      const start = pageIndex * tracksPerPage + 1;
      const end = Math.min(start + chunk.length - 1, tracks.length);

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.playlist} ${playlistName}`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.music} **Tracks ${start}-${end}** of ${tracks.length} | ${privacyDisplay}\n` +
        `${blackEmoji.time} **Total Duration:** ${formatDuration(totalDuration)}`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk.join("\n")));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.info} Page ${pageIndex + 1}/${chunks.length}`
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
      new ButtonBuilder().setCustomId("plv_first").setLabel("First").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
      new ButtonBuilder().setCustomId("plv_prev").setLabel("Previous").setStyle(ButtonStyle.Primary).setDisabled(page === 0),
      new ButtonBuilder().setCustomId("plv_next").setLabel("Next").setStyle(ButtonStyle.Primary).setDisabled(page === chunks.length - 1),
      new ButtonBuilder().setCustomId("plv_last").setLabel("Last").setStyle(ButtonStyle.Secondary).setDisabled(page === chunks.length - 1)
    );

    const pageC = createPage(chunks[currentPage], currentPage);
    pageC.addActionRowComponents(getRow(currentPage));

    const msg = await message.reply({ components: [pageC], flags: MessageFlags.IsComponentsV2 });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 120000,
      componentType: ComponentType.Button,
    });

    collector.on("collect", async (interaction) => {
      switch (interaction.customId) {
        case "plv_first": currentPage = 0; break;
        case "plv_prev": currentPage = Math.max(0, currentPage - 1); break;
        case "plv_next": currentPage = Math.min(chunks.length - 1, currentPage + 1); break;
        case "plv_last": currentPage = chunks.length - 1; break;
      }
      const updatedC = createPage(chunks[currentPage], currentPage);
      updatedC.addActionRowComponents(getRow(currentPage));
      await interaction.update({ components: [updatedC], flags: MessageFlags.IsComponentsV2 });
    });

    collector.on("end", async () => {
      const finalC = createPage(chunks[currentPage], currentPage);
      await msg.edit({ components: [finalC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  },
};

function formatDuration(ms) {
  if (!ms || isNaN(ms) || ms <= 0) return "0:00";
  if (ms > 100000000000) ms = ms / 1000;
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
