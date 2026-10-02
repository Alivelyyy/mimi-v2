const genGraph = require("@gen/eqGraph.js");
const { 
  ActionRowBuilder, 
  ButtonStyle,
  ButtonBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "equalizer",
  aliases: ['eq', 'equaliser'],
  cooldown: "",
  category: "filter",
  usage: "",
  description: "5-band Eq",
  args: false,
  vote: true,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args) => {
    const player = await client.getPlayer(message.guild.id);
    const buttonData = {
      ////////////////////////////////// 2(0.75)-DB ////////////////////////////////////////

      "62.5-plus_2db": {
        customId: "62.5-plus_2db",
        label: "+2",
        style: "SECONDARY",
        disabled: false,
        band: 0,
        gain: 0.75,
      },
      "250-plus_2db": {
        customId: "250-plus_2db",
        label: "+2",
        style: "SECONDARY",
        disabled: false,
        band: 3,
        gain: 0.75,
      },
      "1k-plus_2db": {
        customId: "1k-plus_2db",
        label: "+2",
        style: "SECONDARY",
        disabled: false,
        band: 7,
        gain: 0.75,
      },
      "3.6k-plus_2db": {
        customId: "3.6k-plus_2db",
        label: "+2",
        style: "SECONDARY",
        disabled: false,
        band: 10,
        gain: 0.75,
      },
      "12k-plus_2db": {
        customId: "12k-plus_2db",
        label: "+2",
        style: "SECONDARY",
        disabled: false,
        band: 14,
        gain: 0.75,
      },

      ////////////////////////////////// 1(0.25)-DB ////////////////////////////////////////

      "62.5-plus_1db": {
        customId: "62.5-plus_1db",
        label: "+1",
        style: "SECONDARY",
        disabled: false,
        band: 0,
        gain: 0.25,
      },
      "250-plus_1db": {
        customId: "250-plus_1db",
        label: "+1",
        style: "SECONDARY",
        disabled: false,
        band: 3,
        gain: 0.25,
      },
      "1k-plus_1db": {
        customId: "1k-plus_1db",
        label: "+1",
        style: "SECONDARY",
        disabled: false,
        band: 7,
        gain: 0.25,
      },
      "3.6k-plus_1db": {
        customId: "3.6k-plus_1db",
        label: "+1",
        style: "SECONDARY",
        disabled: false,
        band: 10,
        gain: 0.25,
      },
      "12k-plus_1db": {
        customId: "12k-plus_1db",
        label: "+1",
        style: "SECONDARY",
        disabled: false,
        band: 14,
        gain: 0.25,
      },

      ////////////////////////////////// 0(0)-DB ////////////////////////////////////////

      "62.5-zero_db": {
        customId: "62.5-zero_db",
        label: "0",
        style: "SUCCESS",
        disabled: true,
        band: 0,
        gain: 0,
      },
      "250-zero_db": {
        customId: "250-zero_db",
        label: "0",
        style: "SUCCESS",
        disabled: true,
        band: 3,
        gain: 0,
      },
      "1k-zero_db": {
        customId: "1k-zero_db",
        label: "0",
        style: "SUCCESS",
        disabled: true,
        band: 7,
        gain: 0,
      },
      "3.6k-zero_db": {
        customId: "3.6k-zero_db",
        label: "0",
        style: "SUCCESS",
        disabled: true,
        band: 10,
        gain: 0,
      },
      "12k-zero_db": {
        customId: "12k-zero_db",
        label: "0",
        style: "SUCCESS",
        disabled: true,
        band: 14,
        gain: 0,
      },

      ////////////////////////////////// -1(-0.25)-DB ////////////////////////////////////////

      "62.5-minus_1db": {
        customId: "62.5-minus_1db",
        label: "-1",
        style: "SECONDARY",
        disabled: false,
        band: 0,
        gain: -0.25,
      },
      "250-minus_1db": {
        customId: "250-minus_1db",
        label: "-1",
        style: "SECONDARY",
        disabled: false,
        band: 3,
        gain: -0.25,
      },
      "1k-minus_1db": {
        customId: "1k-minus_1db",
        label: "-1",
        style: "SECONDARY",
        disabled: false,
        band: 7,
        gain: -0.25,
      },
      "3.6k-minus_1db": {
        customId: "3.6k-minus_1db",
        label: "-1",
        style: "SECONDARY",
        disabled: false,
        band: 10,
        gain: -0.25,
      },
      "12k-minus_1db": {
        customId: "12k-minus_1db",
        label: "-1",
        style: "SECONDARY",
        disabled: false,
        band: 14,
        gain: -0.25,
      },

      ////////////////////////////////// 2(-0.75)-DB ////////////////////////////////////////

      "62.5-minus_2db": {
        customId: "62.5-minus_2db",
        label: "-2",
        style: "SECONDARY",
        disabled: false,
        band: 0,
        gain: -0.75,
      },
      "250-minus_2db": {
        customId: "250-minus_2db",
        label: "-2",
        style: "SECONDARY",
        disabled: false,
        band: 3,
        gain: -0.75,
      },
      "1k-minus_2db": {
        customId: "1k-minus_2db",
        label: "-2",
        style: "SECONDARY",
        disabled: false,
        band: 7,
        gain: -0.75,
      },
      "3.6k-minus_2db": {
        customId: "3.6k-minus_2db",
        label: "-2",
        style: "SECONDARY",
        disabled: false,
        band: 10,
        gain: -0.75,
      },
      "12k-minus_2db": {
        customId: "12k-minus_2db",
        label: "-2",
        style: "SECONDARY",
        disabled: false,
        band: 14,
        gain: -0.75,
      },
    };

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# 5-Band Equalizer`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.cog} **Adjust the frequency bands below**\n` +
        `**64 hzㅤ 250 hzㅤ 1K hzㅤ 4K hzㅤ 12K hz**`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`*Eq will be applied once buttons disappear - 20sec*`)
    );

    const styleMap = {
      secondary: ButtonStyle.Secondary,
      success: ButtonStyle.Success,
      danger: ButtonStyle.Danger,
      primary: ButtonStyle.Primary,
    };

    let button = [
      ...Object.values(buttonData).map((data) => {
        return new ButtonBuilder()
          .setCustomId(data.customId)
          .setLabel(data.label)
          .setStyle(styleMap[data.style.toLowerCase()]);
      }),
    ];

    const rows = [];

    for (let i = 0; i < 5; i++) {
      const row = new ActionRowBuilder();
      for (let j = 0; j < 5; j++) {
        const index = i * 5 + j;
        row.addComponents(button[index]);
      }
      rows.push(row);
    }

    // Add button rows to container using addActionRowComponents
    rows.forEach(row => {
      container.addActionRowComponents(row);
    });

    const m = await message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => {});

    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) {
        return true;
      }
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Only **${message.author.tag}** can use this`)
      );
      await interaction
        .reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true,
        })
        .catch(() => {});
      return false;
    };
    // Track selected buttons for final equalizer calculation
    const selectedButtons = new Map();

    const collector = m?.createMessageComponentCollector({
      filter: filter,
      time: 20000,
      idle: 20000 / 2,
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.replied || !interaction.deffered)
        await interaction.deferUpdate().catch(() => {});

      // Track the selected button
      const frequency = interaction.customId.split("-")[0];
      selectedButtons.set(frequency, buttonData[interaction.customId]);

      Object.values(buttonData).map((button) =>
        button.customId == interaction.customId
          ? (button.disabled = true) && (button.style = "SUCCESS")
          : button.customId.includes(interaction.customId.split("-")[0])
            ? (button.style = "SECONDARY") && (button.disabled = false)
            : (button.disabled = button.disabled)
      );

      let updatedButton = [
        ...Object.values(buttonData).map((data) => {
          return new ButtonBuilder()
            .setCustomId(data.customId)
            .setLabel(data.label)
            .setStyle(styleMap[data.style.toLowerCase()])
            .setDisabled(data.disabled);
        }),
      ];

      let updatedRows = [];

      for (let i = 0; i < 5; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 5; j++) {
          const index = i * 5 + j;
          row.addComponents(updatedButton[index]);
        }
        updatedRows.push(row);
      }

      const updatedContainer = new ContainerBuilder();
      updatedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# 5-Band Equalizer`)
      );
      updatedContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      updatedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.cog} **Adjust the frequency bands below**\n` +
          `**64 hzㅤ 250 hzㅤ 1K hzㅤ 4K hzㅤ 12K hz**`
        )
      );
      updatedContainer.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      updatedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Eq will be applied once buttons disappear - 20sec*`)
      );
      updatedRows.forEach(row => {
        updatedContainer.addActionRowComponents(row);
      });

      await m
        .edit({
          components: [updatedContainer],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => {});
    });

    collector?.on("end", async (collected, reason) => {
      if (collected.size == 0) {
        await player.shoukaku.setFilters({
          op: "filters",
          guildId: message.guild.id,
          equalizer: [],
        });
        const timeoutContainer = new ContainerBuilder();
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.cool} **Timed out ! Falling back to default profile**`)
        );
        await m
          .edit({
            components: [timeoutContainer],
            flags: MessageFlags.IsComponentsV2,
          })
          .then(async (fb) =>
            setTimeout(async () => {
              const defaultContainer = new ContainerBuilder();
              defaultContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${blackEmoji.yes} **Equalizer profile set to default - \`Harman 2019\`**`)
              );
              await fb
                .edit({
                  components: [defaultContainer],
                  flags: MessageFlags.IsComponentsV2,
                })
                .catch(() => {});
            }, 2000)
          )
          .catch(() => {});
        return;
      }

      // Build equalizer array from tracked selections
      let equalizer = [];
      for (const [frequency, buttonInfo] of selectedButtons.entries()) {
        equalizer.push({
          band: buttonInfo.band,
          gain: buttonInfo.gain,
        });
      }

      await player.shoukaku.setFilters({
        op: "filters",
        guildId: message.guild.id,
        equalizer: equalizer,
      });

      const processingContainer = new ContainerBuilder();
      processingContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.cog} **Optimizing and applying eq . . .**`)
      );
      await m
        .edit({
          components: [processingContainer],
          flags: MessageFlags.IsComponentsV2,
        })
        .then(async (m) => {
          equalizer = equalizer.sort((a, b) => a.band - b.band);
          let gains = [...equalizer].map((ele) => ele.gain * 4);

          setTimeout(async () => {
            const graphUrl = await genGraph(gains);
            const successContainer = new ContainerBuilder();
            successContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# Successfully Applied Equalizer`)
            );
            successContainer.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            successContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`**Equalizer Graph:**`)
            );
            successContainer.addMediaGalleryComponents(
              new (require("discord.js").MediaGalleryBuilder)().addItems(
                new (require("discord.js").MediaGalleryItemBuilder)().setURL(graphUrl)
              )
            );
            await m
              .edit({
                components: [successContainer],
                flags: MessageFlags.IsComponentsV2,
              })
              .catch(() => {});
          }, 5000);
        })
        .catch(() => {});
    });
  },
};
