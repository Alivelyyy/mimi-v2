const { 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');
const yt =
  /^(?:(?:(?:https?:)?\/\/)?(?:www\.)?)?(?:youtube\.com\/(?:[^\/\s]+\/\S+\/|(?:c|channel|user)\/\S+|embed\/\S+|watch\?(?=.*v=\S+)(?:\S+&)*v=\S+)|(?:youtu\.be\/\S+)|yt:\S+)$/i;

module.exports = {
  name: "search",
  aliases: ['se', 'findsong'],
  cooldown: "",
  category: "music",
  usage: "",
  description: "search some song",
  args: true,
  vote: false,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, prefix) => {
    const { channel } = message.member.voice;

    const query = args.join(" ");

    if (yt.test(query)) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Provider Not Allowed`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} This provider is against ToS\n` +
          `${blackEmoji.arrow} Please use Spotify or SoundCloud`
        )
      );
      return await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    }

    const loadingContainer = new ContainerBuilder();
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Searching`)
    );
    loadingContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Query:** ${query}\n` +
        `${blackEmoji.arrow} Searching multiple sources...`
      )
    );

    let x = await message.reply({
      components: [loadingContainer],
      flags: MessageFlags.IsComponentsV2
    }).catch(() => {});

    const player = await client.manager.createPlayer({
      voiceId: channel.id,
      textId: message.channel.id,
      guildId: message.guild.id,
      shardId: message.guild.shardId,
      loadBalancer: true,
      deaf: true,
    });

    const result = {};
    result.youtube = await player
      .search(query, {
        requester: message.author,
        engine: "youtube",
      })
      .then((res) => res.tracks);

    result.spotify = await player
      .search(query, {
        requester: message.author,
        engine: "spotify",
      })
      .then((res) => res.tracks);

    result.soundcloud = await player
      .search(query, {
        requester: message.author,
        engine: "soundcloud",
      })
      .then((res) => res.tracks);

    result.tracks = [
      ...result.youtube.slice(0, 5),
      ...result.spotify.slice(0, 5),
      ...result.soundcloud.slice(0, 5),
    ];

    if (!result.tracks.length || result.tracks.length == 0) {
      const noResContainer = new ContainerBuilder();
      noResContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} No Results`)
      );
      noResContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      noResContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No results found for: **${query}**\n` +
          `${blackEmoji.arrow} Try a different search term`
        )
      );
      return x
        ? await x.edit({ components: [noResContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {})
        : await message.reply({ components: [noResContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    const tracks = result.tracks;

    const options = await Promise.all(
      tracks.map(async (track, index) => ({
        label: `${index} -  ${
          track.title.charAt(0).toUpperCase() + track.title.substring(1, 30)
        }`,
        value: `${index}`,
        description: `Author: ${track.author.substring(0, 30)}     Duration: ${
          track?.isStream ? "◉ LIVE" : client.formatTime(track.length)
        }`,
        emoji: blackEmoji[track.sourceName] || blackEmoji.music,
      }))
    );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("menu")
      .setPlaceholder("Search results")
      .setMinValues(1)
      .setMaxValues(5)
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    const resContainer = new ContainerBuilder();
    resContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.search} Search Results`)
    );
    resContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    resContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Query:** ${query}\n` +
        `${blackEmoji.arrow} **Found:** ${tracks.length} tracks\n` +
        `${blackEmoji.arrow} Select up to 5 tracks below:`
      )
    );
    resContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    resContainer.addActionRowComponents(row);

    const m = x
      ? await x.edit({ components: [resContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {})
      : await message.reply({ components: [resContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) {
        return true;
      }
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Only **${message.author.tag}** can use this`)
      );
      await interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      }).catch(() => {});
      return false;
    };
    const collector = m?.createMessageComponentCollector({
      filter: filter,
      time: 60000,
      idle: 60000 / 2,
    });

    collector?.on("end", async (collected, reason) => {
      if (collected.size == 0) {
        const timeoutContainer = new ContainerBuilder();
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.time} Timed Out`)
        );
        timeoutContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} No track was selected\n` +
            `${blackEmoji.arrow} Use \`${client.prefix}search\` to try again`
          )
        );
        await m.edit({
          components: [timeoutContainer],
          flags: MessageFlags.IsComponentsV2
        }).catch(() => {});
      }
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.deferred) interaction.deferUpdate();
      await m?.delete().catch(() => {});

      let addedTracks = [];
      let failedTracks = [];
      
      for (const value of interaction.values) {
        const song = tracks[value];
        if (song.length < 10000) {
          failedTracks.push(song.title.substring(0, 25));
          continue;
        }
        await player.queue.add(song);
        addedTracks.push(song.title.substring(0, 25));
      }
      
      const resultContainer = new ContainerBuilder();
      resultContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.queue} Tracks Added`)
      );
      resultContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      
      let content = '';
      if (addedTracks.length > 0) {
        content += `${blackEmoji.yes} **Added:** ${addedTracks.length} tracks\n`;
        addedTracks.forEach(t => {
          content += `${blackEmoji.arrow} ${t}...\n`;
        });
      }
      if (failedTracks.length > 0) {
        content += `\n${blackEmoji.no} **Failed:** ${failedTracks.length} tracks (too short)\n`;
      }
      content += `\n${blackEmoji.arrow} **Added by:** ${message.author}`;
      
      resultContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content)
      );
      
      await message.reply({
        components: [resultContainer],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
      if (!player.playing && !player.paused) player.play();
    });
  },
};
