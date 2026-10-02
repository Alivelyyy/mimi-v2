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
  name: "like",
  aliases: ['fav', 'heart'],
  category: "Favorites",
  description: "Add the currently playing song to your favorites",
  args: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  player: true,
  
  execute: async (client, message, args, emoji) => {
    const player = client.manager.players.get(message.guild.id);
    
    if (!player?.queue?.current) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} No song is currently playing`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const currentTrack = player.queue.current;
    const userId = message.author.id;
    
    const userFavorites = (await favorites.get(`${userId}`)) || [];
    
    if (userFavorites.find(track => track.uri === currentTrack.uri)) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.no} **[${currentTrack.title}](${currentTrack.uri})** is already in your favorites!`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const trackData = {
      title: currentTrack.title,
      uri: currentTrack.uri,
      duration: currentTrack.length,
      author: currentTrack.author,
      addedAt: Date.now()
    };

    userFavorites.push(trackData);
    await favorites.set(`${userId}`, userFavorites);

    const container = new ContainerBuilder();
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Added to Your Favorites!`)
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.music} **Song:** [${currentTrack.title}](${currentTrack.uri})\n` +
        `${blackEmoji.user} **Artist:** ${currentTrack.author}\n` +
        `${blackEmoji.list} **Total Favorites:** ${userFavorites.length} songs`
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  },
};
