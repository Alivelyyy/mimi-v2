const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const Playlist = require("@db/playlistSchema.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "plplay",
  aliases: ['plp', 'playplaylist'],
  category: "playlist",
  usage: "<playlist name>",
  description: "Load and play songs from your playlist",
  args: true,
  premium: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  playerCheck: false,

  execute: async (client, message, args) => {
    const { channel } = message.member.voice;
    const existingPlayer = await client.getPlayer(message.guild.id);

    if (existingPlayer?.radioMode) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Radio Active`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Stop the radio first before playing a playlist`
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
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}plplay <name>\``
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

    const tracks = playlist.tracks;
    if (!tracks?.length) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Empty Playlist`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} \`${playlistName}\` has no tracks\n` +
        `${blackEmoji.arrow} Add tracks with \`${client.prefix}pladd ${playlistName} <song>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const loadingC = new ContainerBuilder();
    loadingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Loading Playlist`));
    loadingC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    loadingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
      `${blackEmoji.music} **Tracks:** ${tracks.length}\n` +
      `${blackEmoji.arrow} Loading tracks, please wait...`
    ));

    const msg = await message.reply({ components: [loadingC], flags: MessageFlags.IsComponentsV2 });

    const player = await client.manager.createPlayer({
      voiceId: channel.id,
      textId: message.channel.id,
      guildId: message.guild.id,
      shardId: message.guild.shardId,
      loadBalancer: true,
      deaf: true,
    });

    let loadedTracks = 0;
    let failedTracks = 0;

    for (const track of tracks) {
      try {
        const result = await player.search(track.uri, { requester: message.author });
        if (result?.tracks?.length) {
          await player.queue.add(result.tracks[0]);
          loadedTracks++;
        } else {
          failedTracks++;
        }
      } catch {
        failedTracks++;
      }
    }

    player.radioMode = false;

    if (!player.playing && !player.paused && player.queue.length) {
      player.play();
    }

    const resultC = new ContainerBuilder();
    resultC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Playlist Loaded`));
    resultC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    let resultText = `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
      `${blackEmoji.music} **Loaded:** ${loadedTracks}/${tracks.length} tracks\n` +
      `${blackEmoji.mic} **Channel:** ${channel.name}`;

    if (failedTracks > 0) {
      resultText += `\n${blackEmoji.warn} **Failed:** ${failedTracks} track(s) could not be loaded`;
    }

    resultC.addTextDisplayComponents(new TextDisplayBuilder().setContent(resultText));
    await msg.edit({ components: [resultC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  },
};
