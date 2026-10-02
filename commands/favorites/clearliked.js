const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const favorites = require("@db/favorites.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "clearliked",
  aliases: ['clearfav', 'clf'],
  category: "favorites",
  description: "Clear all your liked songs",
  args: false,
  
  execute: async (client, message, args, emoji) => {
    const userFavorites = await favorites.get(`${message.author.id}`);
    const count = userFavorites?.length || 0;
    
    await favorites.delete(`${message.author.id}`);
    
    const container = new ContainerBuilder();
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Favorites Cleared`)
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.delete} **Removed:** ${count} track(s)\n` +
        `${blackEmoji.user} **User:** ${message.author.username}\n\n` +
        `${blackEmoji.arrow} Use \`${client.prefix}like\` to add new favorites`
      )
    );
    
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  },
};
