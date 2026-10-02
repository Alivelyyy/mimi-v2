const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const Playlist = require("@db/playlistSchema.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "pladd",
  aliases: ['pla', 'addtoplaylist'],
  category: "playlist",
  usage: "<playlist name> [song url/name]",
  description: "Add a song to your playlist - Add currently playing track or search for a song",
  args: true,
  premium: true,

  execute: async (client, message, args) => {
    if (!args[0]) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Missing Playlist Name`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Please provide a playlist name\n` +
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}pladd <playlist> [song]\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const playlistName = args[0];
    const query = args.slice(1).join(" ");

    try {
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

      if (playlist.tracks && playlist.tracks.length >= 500) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Playlist Full`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} This playlist has reached the **500 track** limit\n` +
          `${blackEmoji.arrow} Remove tracks with \`${client.prefix}plremove ${playlistName} <#>\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const player = await client.getPlayer(message.guild.id);

      if (!query && player?.queue?.current) {
        const currentTrack = player.queue.current;

        const isDuplicate = playlist.tracks?.some(t => t.uri === currentTrack.uri);
        if (isDuplicate) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Duplicate Track`));
          c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} **[${currentTrack.title}](${currentTrack.uri})** is already in \`${playlistName}\``
          ));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        await Playlist.updateOne(
          { userId: message.author.id, name: playlistName },
          { $push: { tracks: {
            title: currentTrack.title,
            uri: currentTrack.uri,
            duration: currentTrack.length || currentTrack.duration || 0,
            thumbnail: currentTrack.thumbnail,
            author: currentTrack.author,
            requester: message.author.id,
            addedAt: new Date()
          }}}
        );

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Track Added`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.music} **Track:** [${currentTrack.title}](${currentTrack.uri})\n` +
          `${blackEmoji.user} **Author:** ${currentTrack.author}\n` +
          `${blackEmoji.playlist} **Playlist:** \`${playlistName}\` (${(playlist.tracks?.length || 0) + 1} tracks)`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });

      } else if (!query) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} No Track Specified`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Provide a song URL/name or have a song playing\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}pladd ${playlistName} <song>\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const loadingC = new ContainerBuilder();
      loadingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Searching`));
      loadingC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      loadingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Searching for \`${query}\`...`
      ));
      const msg = await message.reply({ components: [loadingC], flags: MessageFlags.IsComponentsV2 });

      let searchPlayer = player;
      let createdTempPlayer = false;

      if (!searchPlayer) {
        const voiceChannel = message.member.voice?.channel;
        if (voiceChannel) {
          searchPlayer = await client.manager.createPlayer({
            guildId: message.guild.id,
            voiceId: voiceChannel.id,
            textId: message.channel.id,
            deaf: true,
          });
          createdTempPlayer = true;
        }
      }

      if (!searchPlayer) {
        const errC = new ContainerBuilder();
        errC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Cannot Search`));
        errC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        errC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Join a voice channel or play music first to search\n` +
          `${blackEmoji.arrow} Or provide a direct URL instead of a search query`
        ));
        return msg.edit({ components: [errC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      try {
        const result = await searchPlayer.search(query, {
          requester: message.author,
          engine: "spotify"
        });

        if (createdTempPlayer) await searchPlayer.destroy().catch(() => {});

        if (!result?.tracks?.length) {
          const errC = new ContainerBuilder();
          errC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} No Results`));
          errC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
          errC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} No results found for \`${query}\`\n` +
            `${blackEmoji.arrow} Try a different search term or URL`
          ));
          return msg.edit({ components: [errC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }

        const track = result.tracks[0];

        const isDuplicate = playlist.tracks?.some(t => t.uri === track.uri);
        if (isDuplicate) {
          const dupC = new ContainerBuilder();
          dupC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Duplicate Track`));
          dupC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
          dupC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} **[${track.title}](${track.uri})** is already in \`${playlistName}\``
          ));
          return msg.edit({ components: [dupC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }

        await Playlist.updateOne(
          { userId: message.author.id, name: playlistName },
          { $push: { tracks: {
            title: track.title,
            uri: track.uri,
            duration: track.length || track.duration || 0,
            thumbnail: track.thumbnail,
            author: track.author,
            requester: message.author.id,
            addedAt: new Date()
          }}}
        );

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Track Added`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.music} **Track:** [${track.title}](${track.uri})\n` +
          `${blackEmoji.user} **Author:** ${track.author}\n` +
          `${blackEmoji.playlist} **Playlist:** \`${playlistName}\` (${(playlist.tracks?.length || 0) + 1} tracks)`
        ));
        return msg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

      } catch (searchError) {
        if (createdTempPlayer) await searchPlayer.destroy().catch(() => {});
        console.error("Error searching track:", searchError);

        const errC = new ContainerBuilder();
        errC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Search Failed`));
        errC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        errC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Failed to search for \`${query}\`\n` +
          `${blackEmoji.arrow} Try a direct URL or different search term`
        ));
        return msg.edit({ components: [errC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    } catch (error) {
      console.error("Error in pladd:", error);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Error`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} An error occurred while adding the track\n` +
        `${blackEmoji.arrow} Please try again later`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
