
/** @format
 * Mimi By ApeX Development
 */

const { 
  ActionRowBuilder, 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const buttonData = require("@assets/filterButtonData.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "filter",
  aliases: ['fx', 'effects'],
  cooldown: "5",
  category: "filter",
  usage: "",
  description: "Choose an audio filter to enhance your music",
  args: false,
  vote: false,
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
    let page = 0;
    let rows = [];

    const filterCategories = {
      [`${blackEmoji.point} Basic Filters`]: ["eightD", "soft", "speed", "karaoke"],
      [`${blackEmoji.point} Popular Effects`]: ["nightcore", "pop", "vaporwave", "bass"],
      [`${blackEmoji.point} Party Effects`]: ["party", "earrape", "equalizer", "electronic"],
      [`${blackEmoji.point} Advanced Filters`]: ["radio", "treblebass", "tremlo", "vibrato"],
      [`${blackEmoji.point} Special Effects`]: ["china", "chimpunk", "darthvader", "daycore"],
      [`${blackEmoji.point} Time Effects`]: ["doubletime", "pitch", "rate", "slow"]
    };

    const styleMap = {
      secondary: ButtonStyle.Secondary,
      success: ButtonStyle.Success,
      danger: ButtonStyle.Danger,
      primary: ButtonStyle.Primary,
    };

    let buttons = [
      ...buttonData.map((data) => {
        return new ButtonBuilder()
          .setCustomId(data.customId)
          .setLabel(data.label)
          .setStyle(styleMap[data.style.toLowerCase()]);
      }),
    ];

    for (let i = 0; i < buttons.length; i += 4) {
      const components = buttons.slice(i, i + 4);
      const row = new ActionRowBuilder().addComponents(...components);
      rows.push(row);
    }

    const pages = [
      [rows[0], rows[1], rows[2], rows[6]],
      [rows[3], rows[4], rows[5], rows[6]],
    ];

    const currentFilter = player.filters.length ? player.filters.join(", ") : "None";
    
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# Audio Filter Selection`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.cog} **Current Status**\n` +
        `Active Filter: \`${currentFilter}\``
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### Available Filter Categories\n` +
        Object.entries(filterCategories)
          .map(([category, filters]) => 
            `${category}\n${filters.map(f => `\`${f}\``).join(", ")}`)
          .join("\n\n")
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.bell} Click a button below to apply a filter\n` +
        `*Takes 2-5 seconds to apply • Page ${page + 1}/2*`
      )
    );

    // Add button rows to container using addActionRowComponents
    pages[page].forEach(row => {
      container.addActionRowComponents(row);
    });

    const m = await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});

    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) return true;
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Only **${message.author.tag}** can use this`)
      );
      await interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2,
        ephemeral: true
      }).catch(() => {});
      return false;
    };

    const collector = m?.createMessageComponentCollector({
      filter,
      time: 60000,
      idle: 30000
    });

    collector?.on("collect", async (interaction) => {
      await interaction.deferUpdate().catch(() => {});

      switch (interaction.customId) {
        case "previous":
          page = page > 0 ? --page : pages.length - 1;
          const prevContainer = new ContainerBuilder();
          prevContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# Audio Filter Selection`)
          );
          prevContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          prevContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.cog} **Current Status**\n` +
              `Active Filter: \`${currentFilter}\``
            )
          );
          prevContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
          );
          prevContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### Available Filter Categories\n` +
              Object.entries(filterCategories)
                .map(([category, filters]) => 
                  `${category}\n${filters.map(f => `\`${f}\``).join(", ")}`)
                .join("\n\n")
            )
          );
          prevContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
          );
          prevContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.bell} Click a button below to apply a filter\n` +
              `*Takes 2-5 seconds to apply • Page ${page + 1}/2*`
            )
          );
          pages[page].forEach(row => {
            prevContainer.addActionRowComponents(row);
          });
          await m.edit({ 
            components: [prevContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
          break;

        case "next":
          page = page + 1 < pages.length ? ++page : 0;
          const nextContainer = new ContainerBuilder();
          nextContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# Audio Filter Selection`)
          );
          nextContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          nextContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.cog} **Current Status**\n` +
              `Active Filter: \`${currentFilter}\``
            )
          );
          nextContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
          );
          nextContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### Available Filter Categories\n` +
              Object.entries(filterCategories)
                .map(([category, filters]) => 
                  `${category}\n${filters.map(f => `\`${f}\``).join(", ")}`)
                .join("\n\n")
            )
          );
          nextContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
          );
          nextContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.bell} Click a button below to apply a filter\n` +
              `*Takes 2-5 seconds to apply • Page ${page + 1}/2*`
            )
          );
          pages[page].forEach(row => {
            nextContainer.addActionRowComponents(row);
          });
          await m.edit({ 
            components: [nextContainer],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => {});
          break;

        default:
          await player.filter(`${interaction.customId}`);
          const processingContainer = new ContainerBuilder();
          processingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${blackEmoji.cog} **Processing filter request...**`)
          );
          processingContainer.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
          );
          processingContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`*Please wait while we optimize the audio*`)
          );
          await m.edit({
            components: [processingContainer],
            flags: MessageFlags.IsComponentsV2
          }).then(async (msg) => {
            setTimeout(async () => {
              const successContainer = new ContainerBuilder();
              successContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# Filter Applied Successfully`)
              );
              successContainer.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
              );
              successContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `${blackEmoji.yes} Applied filter: \`${interaction.customId}\`\n` +
                  `${blackEmoji.bell} Use \`${client.prefix}filter\` to apply another filter`
                )
              );
              await msg.edit({
                components: [successContainer],
                flags: MessageFlags.IsComponentsV2
              }).catch(() => {});
            }, 2000);
          });
          break;
      }
    });

    collector?.on("end", async (collected, reason) => {
      if (collected.size === 0) {
        const timeoutContainer = new ContainerBuilder();
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.cool} Filter selection timed out`)
        );
        await m.edit({
          components: [timeoutContainer],
          flags: MessageFlags.IsComponentsV2
        }).catch(() => {});
      }
    });
  },
};
