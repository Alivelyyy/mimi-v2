const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  MessageFlags 
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "skip",
  aliases: ['s', 'next'],
  cooldown: "",
  category: "music",
  usage: "[ position in queue ]",
  description: "skip current song",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, prefix) => {
    const player = await client.getPlayer(message.guild.id);
    const skippedTrack = player.queue.current;

    if (player.queue.length == 0 && !player.data.get("autoplay")) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Nothing to Skip`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No more songs left in the queue\n` +
          `${blackEmoji.arrow} Add songs with \`${client.prefix}play <song>\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    if (args[0]) {
      const position = Number(args[0]);

      if (!position || position < 0 || position > player.queue.length) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid Position`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Invalid queue position provided\n` +
            `${blackEmoji.arrow} **Queue length:** ${player.queue.length} tracks`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
      
      if (position > 1) {
        player.queue.splice(0, position - 1);
      }
    }

    if (skippedTrack && !skippedTrack.isAutoplay) {
      player.data.set("autoplaySystem", skippedTrack);
      if (!player.data.get("autoplayOriginalSource")) {
        player.data.set("autoplayOriginalSource", skippedTrack.sourceName);
      }
    }

    const nextTrack = player.queue[0];

    await player.skip();

    setTimeout(async () => {
      if (player.data.get("autoplay") && player.queue.length === 0) {
        const channel = client.channels.cache.get(player.textId);
        if (channel) {
          const autoplay = require("@functions/autoplay");
          await autoplay(client, player, channel);
        }
      }
    }, 800);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.skip} Track Skipped`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    let skipInfo = `${blackEmoji.arrow} **Skipped:** ${skippedTrack?.title?.replace("[", "").replace("]", "")}\n` +
      `${blackEmoji.arrow} **Skipped by:** ${message.author}`;

    if (nextTrack && !nextTrack.isAutoplay) {
      skipInfo += `\n\n${blackEmoji.music} **Now Playing:** ${nextTrack.title.substring(0, 55)}\n` +
        `${blackEmoji.arrow} **Duration:** \`${nextTrack.isStream ? 'LIVE' : client.formatTime(nextTrack.length)}\``;
      if (player.queue.length > 0) {
        skipInfo += `\n${blackEmoji.arrow} **Queue:** ${player.queue.length} tracks remaining`;
      }
    } else if (player.data.get("autoplay")) {
      skipInfo += `\n\n${blackEmoji.autoplay} **Autoplay** is finding the next track...`;
    } else {
      skipInfo += `\n\n${blackEmoji.arrow} Queue is now empty`;
    }

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(skipInfo)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  },
};
