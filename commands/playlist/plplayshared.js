const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const Playlist = require("@db/playlistSchema.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "plplayshared",
  aliases: ['plps', 'playshared'],
  category: "playlist",
  usage: "<share code>",
  description: "Play a public playlist using its share code",
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
        `${blackEmoji.arrow} Stop the radio first before playing a shared playlist`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (!args[0]) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Missing Share Code`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Please provide a share code\n` +
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}plplayshared <code>\`\n` +
        `${blackEmoji.arrow} Browse public playlists: \`${client.prefix}plpubliclist\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      const shareCode = args[0];
      const playlist = await Playlist.findOne({ shareCode, isPublic: true });

      if (!playlist) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid Share Code`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No public playlist found with code \`${shareCode}\`\n` +
          `${blackEmoji.arrow} The playlist may have been made private or deleted`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const tracks = playlist.tracks;
      if (!tracks?.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Empty Playlist`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} The shared playlist \`${playlist.name}\` has no tracks`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const owner = client.users.cache.get(playlist.userId);
      const ownerName = owner?.username || "Unknown";

      const loadingC = new ContainerBuilder();
      loadingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Loading Shared Playlist`));
      loadingC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      loadingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.playlist} **Playlist:** \`${playlist.name}\` by ${ownerName}\n` +
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
      resultC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Shared Playlist Loaded`));
      resultC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      let resultText = `${blackEmoji.playlist} **Playlist:** \`${playlist.name}\` by ${ownerName}\n` +
        `${blackEmoji.music} **Loaded:** ${loadedTracks}/${tracks.length} tracks\n` +
        `${blackEmoji.mic} **Channel:** ${channel.name}`;

      if (failedTracks > 0) {
        resultText += `\n${blackEmoji.warn} **Failed:** ${failedTracks} track(s) could not be loaded`;
      }

      resultC.addTextDisplayComponents(new TextDisplayBuilder().setContent(resultText));
      await msg.edit({ components: [resultC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (error) {
      console.error("Error in plplayshared:", error);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Error`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} An error occurred while loading the shared playlist`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
