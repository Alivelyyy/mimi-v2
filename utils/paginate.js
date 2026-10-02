const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");

module.exports = async (client, message, pages) => {
  if (pages.length == 1)
    return await message
      .reply({
        embeds: [
          pages[0].setFooter({
            text: `Page [1/1] By ApeX`,
          }),
        ],
      })
      .catch(() => {});

  let page = 0;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("back").setLabel("Back").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("next").setLabel("Next").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("home").setLabel("Home").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("end").setLabel("✖").setStyle(ButtonStyle.Danger)
  );

  const m = await message.channel
    .send({
      embeds: [
        pages[page].setFooter({
          text: `Page [${page + 1}/${pages.length}] By ApeX`,
        }),
      ],
      components: [row],
    })
    .catch(() => {});

  const filter = async (interaction) => {
    if (interaction.user.id === message.author.id) {
      return true;
    }
    
    const errorContainer = new ContainerBuilder();
    errorContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${emoji.error} Access Denied`)
    );
    errorContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    errorContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`This isn't meant for you`)
    );
    
    await interaction
      .reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      })
      .catch(() => {});
    return false;
  };
  const collector = m?.createMessageComponentCollector({
    filter,
    time: 60000,
  });

  collector?.on("collect", async (interaction) => {
    await interaction.deferUpdate();

    switch (interaction.customId) {
      case "home":
        page = 0;
        await m
          .edit({
            embeds: [
              pages[page].setFooter({
                text: `Page [${page + 1}/${pages.length}] By ApeX`,
              }),
            ],
          })
          .catch(() => {});
        break;

      case "back":
        page = page > 0 ? --page : pages.length - 1;
        await m
          .edit({
            embeds: [
              pages[page].setFooter({
                text: `Page [${page + 1}/${pages.length}] By ApeX`,
              }),
            ],
          })
          .catch(() => {});
        break;

      case "next":
        page = page + 1 < pages.length ? ++page : 0;
        await m
          .edit({
            embeds: [
              pages[page].setFooter({
                text: `Page [${page + 1}/${pages.length}] By ApeX`,
              }),
            ],
          })
          .catch(() => {});
        break;

      case "end":
        await collector.stop();
        break;
    }
  });

  collector?.on("end", (collected, reason) => {
    m.edit({
      components: [],
    }).catch(() => {});
  });
};
