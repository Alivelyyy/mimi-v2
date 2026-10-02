const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

function estimateWait(player, client) {
  let totalMs = 0;
  const current = player.queue.current;
  if (current && current.length && !current.isStream) {
    totalMs += Math.max(0, current.length - (player.position || 0));
  }
  for (let i = 0; i < player.queue.length - 1; i++) {
    const t = player.queue[i];
    if (t && t.length && !t.isStream) totalMs += t.length;
  }
  return totalMs > 0 ? client.formatTime(totalMs) : null;
}

module.exports = {
  name: "play",
  aliases: ['p', 'music'],
  category: "music",
  usage: "<uri / name / file>",
  description: "Play a song using your default search engine",
  inVoiceChannel: true,
  sameVoiceChannel: true,

  execute: async (client, message, args, prefix) => {
    const { channel } = message.member.voice;
    const existing_player = await client.getPlayer(message.guild.id);

    if (existing_player && existing_player.radioMode) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.radio} Radio Mode Active`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Radio is currently playing\n` +
          `${blackEmoji.arrow} Stop it before playing a song`
        )
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const file = message.attachments;
    const query = file.size ? file.first().attachment : args.join(" ");

    if (!query) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} No Query Provided`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Please provide a song name or URL\n` +
          `${blackEmoji.arrow} Try a radio: \`${client.prefix}radio\`\n` +
          `${blackEmoji.arrow} Set default engine: \`${client.prefix}engine\``
        )
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    }

    const musicSource = require("@db/musicSource.js");
    const defaultEngine = await musicSource.get(`${message.author.id}`) || "youtube";

    const engineDisplay = {
      youtube: `${blackEmoji.youtube} YouTube`,
      youtube_music: `${blackEmoji.youtube} YouTube Music`,
      spotify: `${blackEmoji.spotify} Spotify`,
      soundcloud: `${blackEmoji.soundcloud} SoundCloud`,
      deezer: `${blackEmoji.deezer} Deezer`,
      apple: `${blackEmoji.apple} Apple Music`,
    };

    const searchContainer = new ContainerBuilder();
    searchContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Searching`)
    );
    searchContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    searchContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Query:** ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}\n` +
        `${blackEmoji.arrow} **Engine:** ${engineDisplay[defaultEngine] || defaultEngine.toUpperCase()}`
      )
    );

    const searchMsg = await message.reply({
      components: [searchContainer],
      flags: MessageFlags.IsComponentsV2
    });

    let player = existing_player;
    
    if (!player) {
      player = await client.manager.createPlayer({
        voiceId: channel.id,
        textId: message.channel.id,
        guildId: message.guild.id,
        shardId: message.guild.shardId,
        loadBalancer: true,
        deaf: true,
      });
    }

    let result;
    let usedEngine = defaultEngine;

    const fallbackChain = ["youtube_music", "soundcloud"];
    const engineQueue   = [defaultEngine, ...fallbackChain.filter(e => e !== defaultEngine)];

    for (const engine of engineQueue) {
      try {
        result = await player.search(query, {
          requester: message.author,
          engine,
        });
        usedEngine = engine;
        if (result && result.tracks.length) break;
      } catch (err) {
        console.error(`Engine ${engine} failed:`, err.message);
        result = null;
      }
    }

    if (!result) {
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Search Failed`)
      );
      errorContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Search failed on all engines\n` +
          `${blackEmoji.arrow} Try: \`${client.prefix}engine\` to change your default engine`
        )
      );
      await searchMsg.edit({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    if (!result || !result.tracks.length) {
      const noResultsContainer = new ContainerBuilder();
      noResultsContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} No Results`)
      );
      noResultsContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      noResultsContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No results found on **${usedEngine.toUpperCase()}**\n` +
          `${blackEmoji.arrow} Try a different search term`
        )
      );

      await searchMsg.edit({
        components: [noResultsContainer],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    const tracks = result.tracks;
    let addedEmbed;
    let addedTrack;
    const wasPlaying = player.playing || player.paused;

    if (result.type === "PLAYLIST") {
      for (let track of tracks) await player.queue.add(track);

      let totalDuration = 0;
      tracks.forEach(t => { if (t.length && !t.isStream) totalDuration += t.length; });

      const playlistContainer = new ContainerBuilder();
      playlistContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.playlist} Playlist Added`)
      );
      playlistContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      playlistContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Playlist:** ${result.playlistName}\n` +
          `${blackEmoji.arrow} **Tracks:** ${tracks.length} — **Duration:** \`${client.formatTime(totalDuration)}\`\n` +
          `${blackEmoji.arrow} **Added by:** ${message.author}\n` +
          `${blackEmoji.arrow} **Source:** ${engineDisplay[usedEngine] || usedEngine.toUpperCase()}`
        )
      );

      addedEmbed = {
        components: [playlistContainer],
        flags: MessageFlags.IsComponentsV2
      };
    } else {
      if (tracks[0].length < 10000) {
        const shortContainer = new ContainerBuilder();
        shortContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Track Too Short`)
        );
        shortContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        shortContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Songs shorter than \`30s\` cannot be played`
          )
        );

        await searchMsg.edit({
          components: [shortContainer],
          flags: MessageFlags.IsComponentsV2
        });
        return;
      }
      addedTrack = tracks[0];
      await player.queue.add(addedTrack);

      const trackDuration = addedTrack.isStream ? 'LIVE' : client.formatTime(addedTrack.length);
      const queuePos = player.queue.length;

      const trackContainer = new ContainerBuilder();
      trackContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} ${wasPlaying ? 'Added to Queue' : 'Now Playing'}`)
      );
      trackContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

      let trackInfo = `${blackEmoji.arrow} **Track:** [${addedTrack.title.substring(0, 50)}](${addedTrack.uri})\n` +
        `${blackEmoji.arrow} **Artist:** ${addedTrack.author.substring(0, 40)}\n` +
        `${blackEmoji.arrow} **Duration:** \`${trackDuration}\`\n` +
        `${blackEmoji.arrow} **Source:** ${engineDisplay[usedEngine] || usedEngine.toUpperCase()}`;

      if (wasPlaying) {
        trackInfo += `\n${blackEmoji.arrow} **Position:** #${queuePos} in queue`;
        const wait = estimateWait(player, client);
        if (wait) {
          trackInfo += `\n${blackEmoji.arrow} **Estimated wait:** \`${wait}\``;
        }
      }

      trackContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(trackInfo)
      );

      addedEmbed = {
        components: [trackContainer],
        flags: MessageFlags.IsComponentsV2
      };
    }

    player.radioMode = false;

    await searchMsg.delete().catch(() => {});

    if (!player.playing && !player.paused) {
      player.play();
    }

    if (addedTrack && player.queue.length > 1) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("add_upcoming")
          .setLabel("Play Next")
          .setEmoji(blackEmoji.upNext)
          .setStyle(ButtonStyle.Success)
      );

      addedEmbed.components[0].addActionRowComponents(row);
      const msg = await message.channel.send(addedEmbed);

      try {
        const interaction = await msg.awaitMessageComponent({
          filter: (i) => i.customId === "add_upcoming" && i.user.id === message.author.id,
          time: 15000,
        });

        const index = player.queue.indexOf(addedTrack);
        if (index !== -1) {
          player.queue.splice(index, 1);
          player.queue.splice(1, 0, addedTrack);

          const upcomingContainer = new ContainerBuilder();
          upcomingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Play Next Set`)
          );
          upcomingContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          upcomingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} **${addedTrack.title.substring(0, 40)}** will play next!\n` +
              `${blackEmoji.arrow} **Moved from:** #${index + 1} → #1`
            )
          );

          await interaction.update({
            components: [upcomingContainer],
            flags: MessageFlags.IsComponentsV2
          });
        }
      } catch (err) {
        await msg.edit({ components: [] }).catch(() => {});
      }
    } else {
      message.channel.send(addedEmbed).catch(() => {});
    }
  },
};
