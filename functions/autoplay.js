const blackEmoji = require('@assets/emojis/black.js');

module.exports = autoplay = async (client, player, channel) => {
  let res = null;
  let currentTrack = player.data.get("autoplaySystem");

  if (!currentTrack) {
    player.data.set("autoplay", false);
    if (channel) {
      await channel.send({
        content: `${blackEmoji.warn} **Autoplay Error:** No reference track found. Please play a song first, then enable autoplay.`
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 7000)).catch(() => {});
    }
    return;
  }

  let engine = player.data.get("autoplayOriginalSource") || currentTrack.sourceName || "youtube";

  let cleanAuthor = currentTrack.author
    .replace(/\d+(\.\d+)?[KMB]?\s*views?/gi, '')
    .replace(/•.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanAuthor.length > 50 || cleanAuthor.includes('...')) {
    cleanAuthor = currentTrack.title.split('-')[0].trim();
  }

  const searchQueries = [];

  if (engine === "youtube" || engine === "spotify") {
    const match = currentTrack.realUri?.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    const id = match ? match[1] : null;
    if (id) {
      searchQueries.push(`https://www.youtube.com/watch?v=${id}&list=RD${id}`);
    }
    searchQueries.push(`ytsearch:${cleanAuthor}`);
  } else if (engine === "apple" || engine === "applemusic") {
    searchQueries.push(`amsearch:${cleanAuthor}`);
    searchQueries.push(`ytsearch:${cleanAuthor}`);
  } else if (engine === "deezer") {
    searchQueries.push(`dzsearch:${cleanAuthor}`);
    searchQueries.push(`ytsearch:${cleanAuthor}`);
  } else if (engine === "soundcloud") {
    searchQueries.push(`scsearch:${cleanAuthor}`);
    searchQueries.push(`ytsearch:${cleanAuthor}`);
  } else {
    searchQueries.push(`ytsearch:${cleanAuthor}`);
  }

  for (const query of searchQueries) {
    try {
      res = await player.search(query, { requester: client.user });
      if (res && res.tracks && res.tracks.length > 5) {
        break;
      }
    } catch (e) {
      console.error(`Autoplay search error for query ${query}:`, e.message);
    }
  }

  if (!res || !res.tracks || res.tracks.length < 5) {
    try {
      const primaryArtist = cleanAuthor.split(',')[0].split('&')[0].split('feat')[0].trim();
      res = await player.search(`ytsearch:${primaryArtist}`, { requester: client.user });
    } catch (e) {
      console.error(`Autoplay fallback search error:`, e.message);
    }
  }

  if (res && res.tracks && res.tracks.length > 0) {
    const recentTitles = [
      currentTrack.title,
      ...(player.queue.previous || []).slice(-5).map(t => t.title),
      ...player.queue.map(t => t.title)
    ];

    let availableTracks = res.tracks.filter(track => {
      if (track.author && (track.author.includes('views') || track.author.includes('\u2022') || track.author.length > 100)) {
        return false;
      }
      if (track.length && track.length < 30000) {
        return false;
      }
      return !recentTitles.some(title =>
        title.toLowerCase() === track.title.toLowerCase()
      );
    });

    if (availableTracks.length === 0) {
      availableTracks = res.tracks.slice(2).filter(t => t.length > 30000);
    }

    if (availableTracks.length === 0) {
      console.log(`[Autoplay] No suitable tracks found after filtering`);
      player.data.set("autoplay", false);
      if (channel) {
        await channel.send({
          content: `${blackEmoji.warn} **Autoplay:** No similar tracks found. Autoplay has been disabled.`
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});
      }
      return;
    }

    const randomPool = availableTracks.slice(0, 15);
    const track = randomPool[Math.floor(Math.random() * randomPool.length)];

    track.isAutoplay = true;

    await player.queue.add(track);

    if (!player.playing && !player.paused) {
      await player.play();
    }
    return;
  }

  player.data.set("autoplay", false);
  if (channel) {
    await channel.send({
      content: `${blackEmoji.warn} **Autoplay failed!** No similar tracks found for: **${currentTrack.title}**`
    }).then(m => {
      setTimeout(() => m.delete().catch(() => {}), 5000);
    }).catch(() => {});
  }
};
