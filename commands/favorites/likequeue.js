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
  name: "likequeue",
  aliases: ['lq', 'likeall'],
  category: "favorites",
  description: "Add all songs from current queue to favorites",
  args: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  
  execute: async (client, message, args, emoji) => {    
    const player = client.manager.players.get(message.guild.id);
    
    if (!player?.queue.length) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Queue Empty`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Add some songs to the queue first\n` +
          `${blackEmoji.arrow} Use \`${client.prefix}play <song>\` to add tracks`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const userId = message.author.id;
    const userFavorites = (await favorites.get(`${userId}`)) || [];
    let added = 0;
    let skipped = 0;

    for (const track of player.queue) {
      if (!userFavorites.find(t => t.uri === track.uri)) {
        userFavorites.push({
          title: track.title,
          uri: track.uri,
          duration: track.length,
          author: track.author,
          addedAt: Date.now()
        });
        added++;
      } else {
        skipped++;
      }
    }

    await favorites.set(`${userId}`, userFavorites);
    
    const container = new ContainerBuilder();
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Queue Added to Favorites`)
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.music} **Added:** ${added} track(s)\n` +
        `${blackEmoji.arrow} **Skipped:** ${skipped} duplicate(s)\n` +
        `${blackEmoji.list} **Total Favorites:** ${userFavorites.length} track(s)\n\n` +
        `${blackEmoji.info} Use \`${client.prefix}showliked\` to view your favorites`
      )
    );
    
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  },
};
