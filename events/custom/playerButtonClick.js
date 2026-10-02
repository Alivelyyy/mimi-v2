
const updateEmbed = require("@functions/updateEmbed");
const replyToClick = require("@functions/replyToClick");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags
} = require("discord.js");

module.exports = {
  name: "playerButtonClick",
  run: async (client, interaction) => {
    /////////////////////////////////////////////////////////////////////////////
    if (!interaction.member.voice.channel) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${client.emoji.warn} **You must be in a voice channel to use this command**`
        )
      );
      return await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }
    
    if (
      interaction.guild.members.me.voice.channel &&
      interaction.guild.members.me.voice.channelId !==
        interaction.member.voice.channelId
    ) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${client.emoji.warn} **You must be in ${interaction.guild.members.me.voice.channel} to use this command**`
        )
      );
      return await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    /////////////////////////////////////////////////////////////////////////////
    const player = await client.getPlayer(interaction.guildId);
    if (!player?.queue?.current) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${client.emoji.warn} **Nothing is being played right now**`
        )
      );
      return await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });
    }

    /////////////////////////////////////////////////////////////////////////////

    switch (interaction.customId) {
      case `${interaction.guildId}play_pause`:
        {
          const isPaused = player.paused;
          await player.pause(!isPaused);
          await replyToClick(interaction);
          await updateEmbed(client, player);
        }
        break;

      case `${interaction.guildId}vol_up`:
        {
          let amount = player.volume + 10;
          if (amount > 150) amount = 150;
          await player.setVolume(amount);
          await replyToClick(interaction);
          await updateEmbed(client, player);
        }
        break;

      case `${interaction.guildId}vol_down`:
        {
          let amount = player.volume - 10;
          if (amount < 0) amount = 0;
          await player.setVolume(amount);
          await replyToClick(interaction);
          await updateEmbed(client, player);
        }
        break;

      case `${interaction.guildId}replay`:
        {
          await player.seek(0);
          await replyToClick(interaction);
        }
        break;

      case `${interaction.guildId}stop`:
        player.queue.clear();
        player.data.delete("autoplay");
        player.loop = "none";
        player.playing = false;
        player.paused = false;
        await player.skip();
        await replyToClick(interaction);
        break;

      case `${interaction.guildId}leave`:
        await player.destroy();
        await replyToClick(interaction);
        break;

      case `${interaction.guildId}loop`:
        const modes = ["none", "track", "queue"];
        const currentIndex = modes.indexOf(player.loop);
        const nextIndex = (currentIndex + 1) % modes.length;
        player.loop = modes[nextIndex];
        await replyToClick(interaction);
        await updateEmbed(client, player);
        break;

      case `${interaction.guildId}shuffle`:
        player.queue.shuffle();
        await replyToClick(interaction);
        break;

      case `${interaction.guildId}seek`:
        // Basic 10 second seek forward
        const position = player.shoukaku.position + 10000;
        await player.seek(position);
        await replyToClick(interaction);
        break;

      /////////////////////////////////////////////////////////////////////////////
      case `${interaction.guildId}skip`:
        if (player.queue.length == 0 && !player.data.get("autoplay")) {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${client.emoji.no} **No more songs left in the queue to skip**`
            )
          );
          return await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
          });
        }
        await player.skip();
        await replyToClick(interaction);
        break;

      /////////////////////////////////////////////////////////////////////////////
      case `${interaction.guildId}previous`:
        if (!player.queue.previous.length > 0) {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${client.emoji.no} **No Previously played song found**`
            )
          );
          return await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
          });
        }
        player.queue.unshift(
          player.queue.previous[player.queue.previous.length - 1],
        );
        await player.skip();
        await replyToClick(interaction);
        break;
      /////////////////////////////////////////////////////////////////////////////

      case `${interaction.guildId}autoplay`:
        player.data.set("autoplay", !player.data.get("autoplay"));
        player.data.set("requester", client.user);
        await replyToClick(interaction);
        await updateEmbed(client, player);
        break;

      case `${interaction.guildId}like`:
        {
          const favorites = require("@db/favorites.js");
          const blackEmoji = require("@assets/emojis/black.js");
          const currentTrack = player.queue.current;
          const userId = interaction.user.id;
          const userFavorites = (await favorites.get(`${userId}`)) || [];

          if (userFavorites.find((track) => track.uri === currentTrack.uri)) {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `${blackEmoji.no} **[${currentTrack.title}](${currentTrack.uri})** is already in your favorites!`
              )
            );
            return await interaction.reply({
              components: [container],
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
          }

          const trackData = {
            title: currentTrack.title,
            uri: currentTrack.uri,
            duration: currentTrack.length,
            author: currentTrack.author,
            addedAt: Date.now(),
          };

          userFavorites.push(trackData);
          await favorites.set(`${userId}`, userFavorites);

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.yes} Added **${currentTrack.title}** to your favorites!`
            )
          );
          await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          });
        }
        break;

      default:
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${client.emoji.bell} **Coming soon . . .**`
          )
        );
        await interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        });
        break;
      /////////////////////////////////////////////////////////////////////////////
    }
  },
};
