const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const Playlist = require("@db/playlistSchema.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "pladdqueue",
  aliases: ['plaq', 'addqueuetopl'],
  category: "playlist",
  usage: "<playlist name>",
  description: "Add the currently playing track and all queued tracks to your playlist",
  args: true,
  premium: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  playerCheck: true,

  execute: async (client, message, args) => {
    const player = await client.getPlayer(message.guild.id);
    if (!player?.queue?.current) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} No Music Playing`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Play some music first before saving to a playlist`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const playlistName = args.join(" ");

    if (!playlistName) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Missing Playlist Name`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Please provide a playlist name\n` +
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}pladdqueue <playlist>\``
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
        `${blackEmoji.arrow} Create one with \`${client.prefix}plcreate ${playlistName}\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const currentCount = playlist.tracks?.length || 0;
    if (currentCount >= 500) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Playlist Full`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} \`${playlistName}\` has reached the **500 track** limit\n` +
        `${blackEmoji.arrow} Remove tracks with \`${client.prefix}plremove ${playlistName} <#>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const remaining = 500 - currentCount;
    const tracksToAdd = [player.queue.current, ...player.queue];
    let addedCount = 0;
    let skippedCount = 0;
    let limitedCount = 0;

    for (const track of tracksToAdd) {
      if (!track) continue;

      if (addedCount >= remaining) {
        limitedCount++;
        continue;
      }

      const isDuplicate = playlist.tracks?.some(t => t.uri === track.uri);
      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      playlist.tracks.push({
        title: track.title,
        uri: track.uri,
        author: track.author,
        duration: track.length || track.duration || track.info?.length || 0,
        thumbnail: track.thumbnail,
        requester: message.author.id,
        addedAt: new Date()
      });
      addedCount++;
    }

    await playlist.save();

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Queue Saved to Playlist`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    let resultText = `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
      `${blackEmoji.music} **Added:** ${addedCount} track(s)\n` +
      `${blackEmoji.list} **Total:** ${playlist.tracks.length} track(s)`;

    if (skippedCount > 0) {
      resultText += `\n${blackEmoji.info} **Skipped:** ${skippedCount} duplicate(s)`;
    }

    if (limitedCount > 0) {
      resultText += `\n${blackEmoji.warn} **Limited:** ${limitedCount} track(s) skipped (500 track limit)`;
    }

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(resultText));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};
