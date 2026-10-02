const load = require("lodash");
const { 
  ActionRowBuilder, 
  ComponentType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "queue",
  aliases: ['q', 'songlist'],
  category: "music",
  usage: "[page number]",
  description: "Shows the current music queue",
  args: false,
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, prefix) => {
    try {
      const player = await client.getPlayer(message.guild.id);

      if (!player || !player.queue) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} No Active Player`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} No active player found\n` +
            `${blackEmoji.arrow} Use \`${client.prefix}play\` to start playing music`
          )
        );

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        });
      }

      const currentTrack = player.queue.current;
      const queuedSongs = player.queue
        .filter(t => !t.isAutoplay)
        .map((t, i) => {
          if (!t || !t.title) return `\`${i + 1}.\` Unknown track`;

          const title = t.title.length > 50 ? t.title.substring(0, 50) + "..." : t.title;
          const duration = t.isStream ? "LIVE" : (t.length ? client.formatTime(t.length) : "00:00");

          return `\`${i + 1}.\` [${title}](${t.uri}) — \`${duration}\``;
        });

      let totalQueueDuration = 0;
      player.queue.filter(t => !t.isAutoplay).forEach(t => {
        if (t && t.length && !t.isStream) totalQueueDuration += t.length;
      });
      if (currentTrack && currentTrack.length && !currentTrack.isStream) {
        totalQueueDuration += Math.max(0, currentTrack.length - (player.position || 0));
      }

      const songsPerPage = 10;
      const pages = load.chunk(queuedSongs, songsPerPage);
      const totalPages = Math.max(pages.length || 1, 1);

      let currentPage = 0;
      if (args[0] && !isNaN(args[0]) && args[0] > 0 && args[0] <= totalPages) {
        currentPage = parseInt(args[0]) - 1;
      }

      const createPage = (pageIndex) => {
        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.queue} Music Queue`)
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );

        if (currentTrack) {
          const nowTitle = currentTrack.title.length > 60 ? currentTrack.title.substring(0, 60) + "..." : currentTrack.title;
          const nowDuration = currentTrack.isStream ? "LIVE" : client.formatTime(currentTrack.length || 0);
          const progress = currentTrack.isStream ? "LIVE" : `${client.formatTime(player.position)}/${nowDuration}`;

          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.music} **Now Playing:**\n` +
              `[${nowTitle}](${currentTrack.uri})\n` +
              `${blackEmoji.arrow} **Duration:** \`${progress}\` — **Volume:** \`${player.volume}%\`\n` +
              `${blackEmoji.arrow} **Requested by:** ${currentTrack.requester}`
            )
          );

          container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
          );
        }

        if (queuedSongs.length === 0) {
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} **Queue:** Empty\n` +
              `${blackEmoji.arrow} Add songs with \`${client.prefix}play <song>\``
            )
          );
        } else {
          const currentPageSongs = pages[pageIndex] || [];
          const startIndex = pageIndex * songsPerPage + 1;

          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**Up Next (${startIndex}-${Math.min(startIndex + currentPageSongs.length - 1, queuedSongs.length)} of ${queuedSongs.length}):**\n\n` +
              currentPageSongs.join("\n")
            )
          );
        }

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        const loopStatus = player.loop ? (player.loop === 'track' ? `${blackEmoji.loopTrack} Track` : player.loop === 'queue' ? `${blackEmoji.loop} Queue` : `${blackEmoji.loopOff} Off`) : `${blackEmoji.loopOff} Off`;
        const shuffleStatus = player.shuffle ? `${blackEmoji.shuffle} On` : `${blackEmoji.loopOff} Off`;
        const autoplayStatus = player.data.get("autoplay") ? `${blackEmoji.autoplay} On` : `${blackEmoji.loopOff} Off`;
        const durationText = totalQueueDuration > 0 ? ` • Duration: \`${client.formatTime(totalQueueDuration)}\`` : '';

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# Page ${pageIndex + 1}/${totalPages}${durationText}\n` +
            `-# Loop: ${loopStatus} • Shuffle: ${shuffleStatus} • Autoplay: ${autoplayStatus}`
          )
        );

        return container;
      };

      if (totalPages === 1 || queuedSongs.length === 0) {
        return message.reply({
          components: [createPage(currentPage)],
          flags: MessageFlags.IsComponentsV2
        });
      }

      const getRow = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("first_queue")
            .setEmoji(blackEmoji.previous)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("prev_queue")
            .setEmoji(blackEmoji.replay)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("page_display")
            .setLabel(`${page + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("next_queue")
            .setEmoji(blackEmoji.play)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages - 1),
          new ButtonBuilder()
            .setCustomId("last_queue")
            .setEmoji(blackEmoji.skip)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages - 1)
        );
      };

      const pageContainer = createPage(currentPage);
      pageContainer.addActionRowComponents(getRow(currentPage));

      const msg = await message.reply({
        components: [pageContainer],
        flags: MessageFlags.IsComponentsV2
      });

      const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 60000,
        componentType: ComponentType.Button
      });

      collector.on("collect", async (interaction) => {
        try {
          await interaction.deferUpdate().catch(() => {});

          switch (interaction.customId) {
            case "first_queue":
              currentPage = 0;
              break;
            case "prev_queue":
              currentPage = Math.max(0, currentPage - 1);
              break;
            case "next_queue":
              currentPage = Math.min(totalPages - 1, currentPage + 1);
              break;
            case "last_queue":
              currentPage = totalPages - 1;
              break;
          }

          const updatedContainer = createPage(currentPage);
          updatedContainer.addActionRowComponents(getRow(currentPage));

          await interaction.message.edit({
            components: [updatedContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        } catch (err) {
          console.error("Error handling queue button interaction:", err);
        }
      });

      collector.on("end", () => {
        try {
          const finalContainer = createPage(currentPage);
          const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("first_queue")
              .setEmoji(blackEmoji.previous)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("prev_queue")
              .setEmoji(blackEmoji.replay)
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("page_display")
              .setLabel(`${currentPage + 1}/${totalPages}`)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("next_queue")
              .setEmoji(blackEmoji.play)
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("last_queue")
              .setEmoji(blackEmoji.skip)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );

          finalContainer.addActionRowComponents(disabledRow);
          msg.edit({ components: [finalContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        } catch (err) {
          console.error("Error disabling queue buttons:", err);
        }
      });

    } catch (error) {
      console.error("Error in queue command:", error);

      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Error`)
      );
      errorContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} An error occurred while displaying the queue\n` +
          `${blackEmoji.arrow} Please try again`
        )
      );

      message.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    }
  },
};
