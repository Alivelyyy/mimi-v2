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
  name: "playliked",
  aliases: ['playfav', 'mymusic'],
  category: "favorites",
  description: "Play your liked songs",
  args: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  
  execute: async (client, message, args, emoji) => {
    const userFavorites = await favorites.get(`${message.author.id}`);
    
    if (!userFavorites?.length) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} No Favorites Found`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} You haven't liked any songs yet\n` +
          `${blackEmoji.arrow} Use \`${client.prefix}like\` while a song is playing to add it`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const loadingContainer = new ContainerBuilder();
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Loading Favorites`)
    );
    loadingContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Searching for ${userFavorites.length} track(s)...\n` +
        `${blackEmoji.arrow} Please wait while we add them to the queue`
      )
    );

    const msg = await message.reply({
      components: [loadingContainer],
      flags: MessageFlags.IsComponentsV2
    });

    const player = await client.manager.createPlayer({
      guildId: message.guild.id,
      textId: message.channel.id,
      voiceId: message.member.voice.channel.id,
      deaf: true,
    });

    const tracks = await Promise.all(
      userFavorites.map(async track => {
        const result = await player.search(track.uri, { requester: message.author });
        return result.tracks[0];
      })
    );

    const validTracks = tracks.filter(t => t);
    player.queue.add(validTracks);
    if (!player.playing) player.play();

    const container = new ContainerBuilder();
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Playing Your Favorites`)
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.music} **Added:** ${validTracks.length} track(s)\n` +
        `${blackEmoji.queue} **Queue Position:** 1-${validTracks.length}\n` +
        `${blackEmoji.user} **Requested by:** ${message.author.username}\n\n` +
        `${blackEmoji.arrow} Now playing from your favorites collection`
      )
    );
    
    return msg.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  },
};
