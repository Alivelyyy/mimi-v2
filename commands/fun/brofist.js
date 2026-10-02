const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require("discord.js");
const axios = require("axios");

module.exports = {
  name: "brofist",
  category: "fun",
  description: "Brofist someone.",
  aliases: ['bf', 'fist'],
  execute: async (client, message, args, emoji) => {
    const user = message.mentions.users.first() || client.users.cache.get(args[0]);
    const me = message.author;

    if (!user) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${emoji.warn} Please mention a user to brofist.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    try {
      const result = await axios.get("https://api.otakugifs.xyz/gif?reaction=brofist&format=gif");
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${me.username}** gave a brofist to **${user.username}**`)
      );
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(result.data.url))
      );
      message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error(error);
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.warn} An error occurred while retrieving the image.`));
      message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  },
};
