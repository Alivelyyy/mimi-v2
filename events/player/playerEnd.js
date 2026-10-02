const autoplay = require("@functions/autoplay");
const { addListeningTime } = require('@utils/userData');

module.exports = {
  name: "playerEnd",
  run: async (client, player, track) => {
    const channel = client.channels.cache.get(player.textId);

    // Calculate listening time for all users in VC
    try {
      const startTime = player.data.get("trackStartTime");
      if (startTime && track) {
        const elapsed = Date.now() - startTime;
        const maxDuration = track.length || 0;
        const listenedMs = maxDuration > 0 ? Math.min(elapsed, maxDuration) : elapsed;
        const voiceChannel = channel?.guild?.members?.me?.voice?.channel;
        if (voiceChannel && listenedMs > 0) {
          voiceChannel.members.forEach(member => {
            if (member.user.bot) return;
            try {
              addListeningTime(member.id, member.user.username, listenedMs);
            } catch (e) {}
          });
        }
      }
    } catch (e) {}

    // Always update autoplaySystem with the track that just ended
    // This ensures we have a reference for finding similar songs
    if (track && ! track.isAutoplay) {
      player.data.set("autoplaySystem", track);
      // Preserve the original source if not already set
      if (!player. data.get("autoplayOriginalSource")) {
        player.data.set("autoplayOriginalSource", track.sourceName);
      }
    }

    if (player.data.get("autoplay")) {
      if (channel) {
        // Delay slightly to ensure queue state is updated
        setTimeout(async () => {
           if (player.queue.length === 0) {
              await autoplay(client, player, channel);
           }
        }, 500);
      } else {
        player.data.set("autoplay", false);
      }
    }
  }
};