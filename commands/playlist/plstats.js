const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const Playlist = require("@db/playlistSchema.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "plstats",
  aliases: ['plst', 'playliststats'],
  category: "playlist",
  usage: "<playlist name>",
  description: "View detailed statistics for a playlist",
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
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}plstats <name>\``
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
    const privacyDisplay = playlist.isPublic ? `${blackEmoji.website} Public` : `${blackEmoji.lock} Private`;
    const createdDate = new Date(playlist.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    if (!tracks.length) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.stats} ${playlistName}`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.music} **Tracks:** 0\n` +
        `${privacyDisplay}\n` +
        `${blackEmoji.time} **Created:** ${createdDate}\n\n` +
        `${blackEmoji.arrow} This playlist is empty — add tracks with \`${client.prefix}pladd ${playlistName} <song>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    let totalDuration = 0;
    const sources = {};

    tracks.forEach(track => {
      if (track.duration && !isNaN(track.duration)) totalDuration += track.duration;

      let source = "Other";
      if (track.uri) {
        if (track.uri.includes("youtube") || track.uri.includes("youtu.be")) source = "YouTube";
        else if (track.uri.includes("spotify")) source = "Spotify";
        else if (track.uri.includes("soundcloud")) source = "SoundCloud";
      }
      sources[source] = (sources[source] || 0) + 1;
    });

    const sourcesText = Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => {
        const pct = Math.round(count / tracks.length * 100);
        return `${blackEmoji.arrow} **${source}:** ${count} (${pct}%)`;
      })
      .join("\n");

    const mostRecent = tracks.reduce((latest, track) => {
      if (track.addedAt && (!latest.addedAt || new Date(track.addedAt) > new Date(latest.addedAt))) return track;
      return latest;
    }, tracks[tracks.length - 1]);

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.stats} ${playlistName}`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.user} **Owner:** ${message.author}\n` +
      `${privacyDisplay}${playlist.shareCode ? ` • Code: \`${playlist.shareCode}\`` : ''}\n` +
      `${blackEmoji.time} **Created:** ${createdDate}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.music} **Tracks:** ${tracks.length}\n` +
      `${blackEmoji.time} **Duration:** ${formatDuration(totalDuration)}\n` +
      `${blackEmoji.list} **Avg per track:** ${formatDuration(Math.floor(totalDuration / tracks.length))}`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Sources**\n${sourcesText}`));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.arrow} **Latest:** [${mostRecent?.title}](${mostRecent?.uri})`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};

function formatDuration(ms) {
  if (!ms || isNaN(ms) || ms <= 0) return "0:00";
  if (ms > 100000000000) ms = ms / 1000;
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
