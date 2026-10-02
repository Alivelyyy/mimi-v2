const Playlist = require("@db/playlistSchema.js");
const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = async (client, message, userId, playlistName) => {
  try {
    const { channel } = message.member.voice;
    const existing_player = await client.getPlayer(message.guild.id);

    if (existing_player && existing_player.radioMode) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`<a:Cross:1415710100697649387> Radio is currently playing! Stop it before playing a playlist.`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    // Check if the playlist exists and is public
    const playlist = await Playlist.findOne({ 
      userId: userId, 
      name: playlistName,
      isPublic: true
    });

    if (!playlist) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`<a:Cross:1415710100697649387> This playlist doesn't exist or is not public.`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const tracks = playlist.tracks;

    if (!tracks || tracks.length === 0) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`<a:Cross:1415710100697649387> This playlist is empty.`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    // Get playlist owner info
    const playlistOwner = client.users.cache.get(userId);
    const ownerName = playlistOwner ? playlistOwner.username : "Unknown User";

    // Create player
    const player = await client.manager.createPlayer({
      voiceId: channel.id,
      textId: message.channel.id,
      guildId: message.guild.id,
      shardId: message.guild.shardId,
      loadBalancer: true,
      deaf: true,
    });

    const loadingContainer = new ContainerBuilder();
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${emoji.bell} Loading ${tracks.length} tracks from **${ownerName}'s** playlist \`${playlistName}\`...`
      )
    );
    message.channel.send({
      components: [loadingContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    // Variable to keep track of successfully loaded tracks
    let loadedTracks = 0;

    // Process each track
    for (const track of tracks) {
      try {
        // Create search options to get actual tracks
        const result = await player.search(track.uri, {
          requester: message.author,
        });

        if (result && result.tracks.length > 0) {
          await player.queue.add(result.tracks[0]);
          loadedTracks++;
        }
      } catch (error) {
        console.error(`Error loading track ${track.title}:`, error);
        // Continue with next track
      }
    }

    // Set non-radio mode
    player.radioMode = false;

    // Start playing if not already playing
    if (!player.playing && !player.paused && player.queue.length) {
      player.play();
    }

    const successContainer = new ContainerBuilder();
    successContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `<a:MekoCheck:1415692999001772103> Successfully loaded **${loadedTracks}/${tracks.length}** tracks from **${ownerName}'s** playlist \`${playlistName}\``
      )
    );
    message.channel.send({
      components: [successContainer],
      flags: MessageFlags.IsComponentsV2,
    });

  } catch (error) {
    console.error("Error in playSharedPlaylist:", error);
    const errorContainer = new ContainerBuilder();
    errorContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `<a:Cross:1415710100697649387> An error occurred while loading the playlist.`
      )
    );
    return message.reply({
      components: [errorContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  }
};