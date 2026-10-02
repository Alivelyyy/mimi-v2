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
const favorites = require("@db/favorites.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "showliked",
  aliases: ['showfav', 'mylist'],
  category: "Favorites",
  description: "Show your liked songs",
  args: false,
  
  execute: async (client, message, args, emoji) => {
    const userFavorites = await favorites.get(`${message.author.id}`);
    if (!userFavorites?.length) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} You don't have any favorites`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const pages = [];
    for (let i = 0; i < userFavorites.length; i += 10) {
      const tracks = userFavorites.slice(i, i + 10);
      const container = new ContainerBuilder();
      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Your Favorite Tracks`)
      );
      
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          tracks.map((track, index) => 
            `\`${i + index + 1}.\` [${track.title}](${track.uri}) by ${track.author}`
          ).join("\n")
        )
      );
      
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Page ${Math.floor(i / 10) + 1}/${Math.ceil(userFavorites.length / 10)} • Total: ${userFavorites.length} tracks*`)
      );
      
      pages.push(container);
    }

    if (pages.length === 1) {
      return message.reply({ 
        components: [pages[0]],
        flags: MessageFlags.IsComponentsV2
      });
    }

    let currentPage = 0;
    const getRow = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("page_display")
          .setLabel(`${page + 1}/${pages.length}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === pages.length - 1)
      );
    };

    pages[currentPage].addActionRowComponents(getRow(currentPage));

    const msg = await message.reply({
      components: [pages[currentPage]],
      flags: MessageFlags.IsComponentsV2
    });

    const collector = msg.createMessageComponentCollector({
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) return;
      
      if (interaction.customId === "prev") {
        currentPage = currentPage > 0 ? --currentPage : pages.length - 1;
      } else if (interaction.customId === "next") {
        currentPage = currentPage + 1 < pages.length ? ++currentPage : 0;
      }

      const updatedContainer = new ContainerBuilder();
      const tracks = userFavorites.slice(currentPage * 10, (currentPage + 1) * 10);
      
      updatedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Your Favorite Tracks`)
      );
      
      updatedContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      
      updatedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          tracks.map((track, index) => 
            `\`${currentPage * 10 + index + 1}.\` [${track.title}](${track.uri}) by ${track.author}`
          ).join("\n")
        )
      );
      
      updatedContainer.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      
      updatedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Page ${currentPage + 1}/${pages.length} • Total: ${userFavorites.length} tracks*`)
      );
      
      updatedContainer.addActionRowComponents(getRow(currentPage));

      await interaction.update({
        components: [updatedContainer],
        flags: MessageFlags.IsComponentsV2
      });
    });

    collector.on("end", () => {
      const finalContainer = new ContainerBuilder();
      finalContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Your Favorite Tracks\n\n*Interaction timed out*`)
      );
      msg.edit({ 
        components: [finalContainer],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    });
  },
};
