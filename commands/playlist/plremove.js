const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const Playlist = require("@db/playlistSchema.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "plremove",
  aliases: ['plr', 'removefrompl'],
  category: "playlist",
  usage: "<playlist name> <track number>",
  description: "Remove a song from your playlist by its track number",
  args: true,
  premium: true,

  execute: async (client, message, args) => {
    if (args.length < 2) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Missing Arguments`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Provide both a playlist name and track number\n` +
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}plremove <playlist> <track#>\`\n` +
        `${blackEmoji.arrow} Use \`${client.prefix}plview <name>\` to see track numbers`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const lastArg = args[args.length - 1];
    const trackNumber = parseInt(lastArg);

    if (isNaN(trackNumber) || trackNumber < 1) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid Track Number`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} \`${lastArg}\` is not a valid track number\n` +
        `${blackEmoji.arrow} Use \`${client.prefix}plview <playlist>\` to see track numbers`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const playlistName = args.slice(0, args.length - 1).join(" ");

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

    const tracks = playlist.tracks;

    if (!tracks?.length) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Empty Playlist`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} \`${playlistName}\` has no tracks to remove`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (trackNumber > tracks.length) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid Track Number`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Track #${trackNumber} doesn't exist\n` +
        `${blackEmoji.arrow} This playlist has **${tracks.length}** track(s)`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const removedTrack = tracks[trackNumber - 1];

    await Playlist.updateOne(
      { userId: message.author.id, name: playlistName },
      { $pull: { tracks: { _id: removedTrack._id } } }
    );

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Track Removed`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.music} **Removed:** [${removedTrack.title}](${removedTrack.uri})\n` +
      `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
      `${blackEmoji.list} **Remaining:** ${tracks.length - 1} track(s)`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};
