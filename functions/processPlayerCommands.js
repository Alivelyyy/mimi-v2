const fs = require('fs');
const path = require('path');

module.exports = async (client) => {
    try {
        const commandsFile = path.join(__dirname, '..', 'player-commands.json');

        if (!fs.existsSync(commandsFile)) {
            return;
        }

        const commands = JSON.parse(fs.readFileSync(commandsFile, 'utf8'));
        const processedCommands = [];
        const unprocessedCommands = [];

        for (const command of commands) {
            // Check if command is recent (within last 5 minutes)
            const commandTime = new Date(command.timestamp);
            const now = new Date();
            const timeDiff = now - commandTime;

            if (timeDiff > 5 * 60 * 1000) {
                // Command is too old, skip it
                continue;
            }

            // Check if already processed
            if (command.processed) {
                processedCommands.push(command);
                continue;
            }

            const guild = client.guilds.cache.get(command.guildId);
            if (!guild) {
                command.processed = true;
                command.error = 'Guild not found';
                processedCommands.push(command);
                continue;
            }

            const member = await guild.members.fetch(command.userId).catch(() => null);
            if (!member) {
                command.processed = true;
                command.error = 'User not found';
                processedCommands.push(command);
                continue;
            }

            const voiceChannel = member.voice.channel;
            if (!voiceChannel) {
                command.processed = true;
                command.error = 'User not in voice channel';
                processedCommands.push(command);
                continue;
            }

            try {
                if (command.type === 'play' || command.type === 'add') {
                    // Get or create player
                    let player = client.manager.players.get(command.guildId);

                    if (!player) {
                        player = await client.manager.createPlayer({
                            guildId: command.guildId,
                            textId: voiceChannel.id,
                            voiceId: voiceChannel.id,
                            volume: 100,
                            deaf: true
                        });
                    }

                    // Search and play/add track
                    const result = await player.search(command.track.url || command.track.uri, {
                        requester: member.user
                    });

                    if (result && result.tracks && result.tracks.length > 0) {
                        const track = result.tracks[0];

                        if (command.type === 'play') {
                            player.queue.clear();
                            player.queue.add(track);
                            if (!player.playing && !player.paused) {
                                await player.play();
                            }
                        } else {
                            player.queue.add(track);
                            if (!player.playing && !player.paused) {
                                await player.play();
                            }
                        }

                        command.processed = true;
                        command.success = true;
                    } else {
                        command.processed = true;
                        command.error = 'Track not found';
                    }
                } else if (command.type === 'control') {
                    const player = client.manager.players.get(command.guildId);

                    if (!player) {
                        command.processed = true;
                        command.error = 'No active player';
                        processedCommands.push(command);
                        continue;
                    }

                    switch (command.action) {
                        case 'pause':
                            player.pause(true);
                            command.processed = true;
                            command.success = true;
                            break;
                        case 'resume':
                            player.pause(false);
                            command.processed = true;
                            command.success = true;
                            break;
                        case 'skip':
                            await player.skip();
                            command.processed = true;
                            command.success = true;
                            break;
                        case 'stop':
                            player.queue.clear();
                            await player.stop();
                            command.processed = true;
                            command.success = true;
                            break;
                        case 'shuffle':
                            player.queue.shuffle();
                            command.processed = true;
                            command.success = true;
                            break;
                        default:
                            command.processed = true;
                            command.error = 'Unknown action';
                    }
                } else if (command.type === 'like') {
                    await handleLikeCommand(client, command);
                    command.processed = true;
                    command.success = true;
                } else if (command.type === 'filter') {
                    await handleFilterCommand(client, command);
                    command.processed = true;
                    command.success = true;
                } else if (command.type === 'pladd') {
                    await handlePlaylistAdd(client, command);
                    command.processed = true;
                    command.success = true;
                } else if (command.type === 'remove') {
                    await handleRemoveFromQueue(client, command);
                    command.processed = true;
                    command.success = true;
                }


                processedCommands.push(command);
            } catch (error) {
                console.error('Error processing command:', error);
                command.processed = true;
                command.error = error.message;
                processedCommands.push(command);
            }
        }

        // Keep only processed commands (for history) and unprocessed ones
        const updatedCommands = [...processedCommands, ...unprocessedCommands].slice(-50);
        fs.writeFileSync(commandsFile, JSON.stringify(updatedCommands, null, 2));

    } catch (error) {
        // Silent error handling
    }
};

// Function to start periodic command processing
module.exports.startPeriodicProcessing = (client) => {
    // Process commands every 2 seconds for responsive playback control
    setInterval(async () => {
        await module.exports(client);
    }, 2000);

    // Don't process immediately on startup
};

async function handleLikeCommand(client, command) {
  try {
    const player = await client.getPlayer(command.guildId);
    if (!player?.queue?.current) return;

    const favorites = require("@db/favorites.js");
    const currentTrack = player.queue.current;
    const userId = command.userId;

    const userFavorites = (await favorites.get(`${userId}`)) || [];

    if (!userFavorites.find(track => track.uri === currentTrack.uri)) {
      const trackData = {
        title: currentTrack.title,
        uri: currentTrack.uri,
        duration: currentTrack.length,
        author: currentTrack.author,
        addedAt: Date.now()
      };

      userFavorites.push(trackData);
      await favorites.set(`${userId}`, userFavorites);
      console.log(`Added ${currentTrack.title} to ${userId}'s favorites`);
    }
  } catch (error) {
    console.error('Error handling like command:', error);
  }
}

async function handleFilterCommand(client, command) {
  try {
    const player = await client.getPlayer(command.guildId);
    if (!player) return;

    const filter = command.filter;

    // Clear all filters first
    player.player.clearFilters();

    // Apply specific filter
    switch (filter) {
      case 'bassboost':
        player.player.setEqualizer([
          { band: 0, gain: 0.6 },
          { band: 1, gain: 0.67 },
          { band: 2, gain: 0.67 },
          { band: 3, gain: 0 },
          { band: 4, gain: -0.5 },
          { band: 5, gain: 0.15 },
          { band: 6, gain: -0.45 },
          { band: 7, gain: 0.23 },
          { band: 8, gain: 0.35 },
          { band: 9, gain: 0.45 },
          { band: 10, gain: 0.55 },
          { band: 11, gain: 0.6 },
          { band: 12, gain: 0.55 },
          { band: 13, gain: 0 }
        ]);
        break;
      case 'nightcore':
        player.player.setTimescale({ speed: 1.2, pitch: 1.2, rate: 1 });
        break;
      case 'vaporwave':
        player.player.setTimescale({ speed: 0.8, pitch: 0.8, rate: 1 });
        break;
      case '8d':
        player.player.setRotation({ rotationHz: 0.2 });
        break;
      case 'karaoke':
        player.player.setKaraoke({ level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 });
        break;
      case 'soft':
        player.player.setLowPass({ smoothing: 20.0 });
        break;
      case 'treblebass':
        player.player.setEqualizer([
          { band: 0, gain: 0.6 },
          { band: 1, gain: 0.67 },
          { band: 2, gain: 0.67 },
          { band: 3, gain: 0 },
          { band: 4, gain: -0.5 },
          { band: 5, gain: 0.15 },
          { band: 6, gain: -0.45 },
          { band: 7, gain: 0.23 },
          { band: 8, gain: 0.35 },
          { band: 9, gain: 0.45 },
          { band: 10, gain: 0.55 },
          { band: 11, gain: 0.6 },
          { band: 12, gain: 0.55 },
          { band: 13, gain: 0.6 }
        ]);
        break;
      case 'clear':
      default:
        // Filters already cleared
        break;
    }

    console.log(`Applied ${filter} filter to guild ${command.guildId}`);
  } catch (error) {
    console.error('Error handling filter command:', error);
  }
}

async function handlePlaylistAdd(client, command) {
  try {
    const player = await client.getPlayer(command.guildId);
    if (!player?.queue?.current) return;

    const Playlist = require("@db/playlistSchema.js");
    const currentTrack = player.queue.current;
    const userId = command.userId;
    const playlistName = command.playlistName;

    const playlist = await Playlist.findOne({
      userId: userId,
      name: playlistName
    });

    if (playlist) {
      const newTrack = {
        title: currentTrack.title,
        uri: currentTrack.uri,
        duration: currentTrack.duration,
        thumbnail: currentTrack.thumbnail,
        author: currentTrack.author,
        requester: userId,
        addedAt: new Date()
      };

      await Playlist.updateOne(
        { userId: userId, name: playlistName },
        { $push: { tracks: newTrack } }
      );

      console.log(`Added ${currentTrack.title} to playlist ${playlistName}`);
    }
  } catch (error) {
    console.error('Error handling playlist add command:', error);
  }
}

async function handleRemoveFromQueue(client, command) {
  try {
    const player = await client.getPlayer(command.guildId);
    if (!player?.queue) return;

    const index = command.index;
    if (index >= 0 && index < player.queue.length) {
      const removedTrack = player.queue[index];
      player.queue.splice(index, 1);
      console.log(`Removed track at index ${index}: ${removedTrack?.title}`);
    }
  } catch (error) {
    console.error('Error handling remove from queue command:', error);
  }
};