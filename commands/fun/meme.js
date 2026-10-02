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
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "meme",
  aliases: ['memes', 'randommeme'],
  category: "fun",
  description: "Get a random meme from Reddit",
  execute: async (client, message, args, emoji) => {
    try {
      const subreddits = [
        "memes", "dankmemes", "wholesomememes", "programmerhumor",
        "funny", "memeeconomy", "cursedimages", "blursedimages"
      ];
      const randomSubreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
      const response = await axios.get(`https://www.reddit.com/r/${randomSubreddit}/random/.json`);

      if (!response.data || !response.data[0] || !response.data[0].data || !response.data[0].data.children[0]) {
        throw new Error("No meme found");
      }

      const memeData = response.data[0].data.children[0].data;

      if (memeData.is_video || !memeData.url.match(/\.(jpeg|jpg|gif|png)$/)) {
        throw new Error("Invalid meme format");
      }

      const title = memeData.title.length > 256 ? memeData.title.substring(0, 253) + "..." : memeData.title;
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${title}**\n${blackEmoji.thumbsup} ${memeData.ups} | r/${randomSubreddit}`)
      );
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(memeData.url))
      );
      message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error("Meme command error:", error);
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji.warn} Could not fetch a meme right now, please try again later!`));
      message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  }
};
