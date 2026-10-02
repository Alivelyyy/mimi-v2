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
  name: "nosebleed",
  category: "fun",
  description: "Nosebleed someone.",
  aliases: ['nbleed', 'anime'],
  execute: async (client, message, args, emoji) => {
    const user = message.mentions.users.first() || client.users.cache.get(args[0]);
    const me = message.author;

    if (!user) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${emoji.warn} Please mention a user to nosebleed.`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    try {
      const result = await axios.get("https://api.otakugifs.xyz/gif?reaction=nosebleed&format=gif");
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${me.username}** got a nosebleed because of **${user.username}**`)
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
