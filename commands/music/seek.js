const progressbar = require("@gen/progressbar");
const {
  ActionRowBuilder,
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
  name: "seek",
  aliases: ['sk', 'jumpto'],
  cooldown: "",
  category: "music",
  usage: "[ Xmin or s eg. 5s, 5min ]",
  description: "seek song to duration",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, prefix) => {
    let player = await client.getPlayer(message.guild.id);

    if (args[0]) {
      let track = await player.queue.current.length;

      const parseTime = (input) => {
        const timeRegex = /^((\d+)\s*(min|m|minutes?))?\s*((\d+)\s*(s|sec)?)?$/;
        const match = input.match(timeRegex);

        if (!match) {
          return null;
        }

        const minutes = match[2] ? parseInt(match[2], 10) : 0;
        const seconds = match[4] ? parseInt(match[4], 10) : 0;

        return minutes * 60 + seconds;
      };

      const timeInSeconds = parseTime(args.join(" "));
      let time = timeInSeconds ? timeInSeconds * 1000 : null;

      if (time) {
        if (track?.isStream) {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Seek Failed`)
          );
          container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} Cannot seek in a **LIVE** stream`
            )
          );
          return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }

        if (time > track) {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Seek Failed`)
          );
          container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} Seek time must be less than song duration\n` +
              `${blackEmoji.arrow} **Track duration:** \`${client.formatTime(track)}\``
            )
          );
          return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
        }

        await player.seek(time);

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Seeked Successfully`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} **Seeked to:** \`${require("ms")(time)}\`\n` +
            `${blackEmoji.arrow} **Seeked by:** ${message.author}`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        }).catch(() => {});
      }
    }

    const generateContainer = async () => {
      let player = await client.getPlayer(message.guild.id);
      let track = player?.queue?.current;
      let total = track?.isStream
        ? `◉ LIVE`
        : client.formatTime(player?.queue?.current?.length);
      let current = client.formatTime(player?.position);

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.time} Seek Controls`)
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Progress:** \`${current}\` / \`${total}\`\n\n${progressbar(player, 14)}`
        )
      );

      return container;
    };

    let track = await player.queue.current;
    
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("-30s")
        .setLabel("- 30s")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(false),
      new ButtonBuilder()
        .setCustomId("-10s")
        .setLabel("- 10s")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(false),
      new ButtonBuilder()
        .setCustomId("+10s")
        .setLabel("+ 10s")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(false),
      new ButtonBuilder()
        .setCustomId("+30s")
        .setLabel("+ 30s")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(false)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("-30s")
        .setLabel("- 30s")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("-10s")
        .setLabel("- 10s")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("+10s")
        .setLabel("+ 10s")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("+30s")
        .setLabel("+ 30s")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    const container = await generateContainer();
    const row = track?.isStream ? row2 : row1;
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    
    container.addActionRowComponents(row);

    let m = await message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      })
      .catch(() => {});

    const seek = async (m, time) => {
      await player.seek(time);
      await client.sleep(300);
      const newContainer = await generateContainer();
      newContainer.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      newContainer.addActionRowComponents(row);
      await m.edit({ components: [newContainer] }).catch(() => {});
    };

    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) {
        return true;
      }
      await interaction
        .reply({
          content: `${blackEmoji.no} Only **${message.author.tag}** can use this`,
          ephemeral: true,
        })
        .catch(() => {});
      return false;
    };

    const collector = m?.createMessageComponentCollector({
      filter: filter,
      time: 60000,
      idle: 30000 / 2,
    });

    collector?.on("collect", async (interaction) => {
      player = await client.getPlayer(message.guild.id);
      let time;
      switch (interaction.customId) {
        case "-30s":
          time = player.position - 30000;
          if (time < 0) time = 0;
          await seek(m, time);
          break;

        case "-10s":
          time = player.position - 10000;
          if (time < 0) time = 0;
          await seek(m, time);
          break;

        case "+10s":
          time = player.position + 10000;
          if (time > (await player.queue.current.length))
            time = (await player.queue.current.length) + 10000;
          await seek(m, time);
          break;

        case "+30s":
          time = player.position + 30000;
          if (time > (await player.queue.current.length))
            time = (await player.queue.current.length) + 30000;
          await seek(m, time);
          break;
      }
      if (!interaction.deferred) interaction.deferUpdate();
    });

    collector?.on("end", async (collected, reason) => {
      const finalContainer = await generateContainer();
      finalContainer.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      finalContainer.addActionRowComponents(row2);
      return m.edit({ components: [finalContainer] }).catch(() => {});
    });
  },
};
