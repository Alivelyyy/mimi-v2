const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

function createProgressBar(current, total, size = 20) {
  if (!total || total <= 0) return '▬'.repeat(size);
  const progress = Math.min(Math.round((size * current) / total), size);
  const emptyProgress = size - progress;
  return '▰'.repeat(progress) + '▱'.repeat(emptyProgress);
}

function buildContainer(track, player, formatTime, isStream) {
  const position  = player.position || 0;
  const duration  = track.length || 0;
  const thumbnail = track.thumbnail || track.artworkUrl;

  const progressBar = isStream ? `${blackEmoji.radio} LIVE` : createProgressBar(position, duration);
  const currentTime = isStream ? `${blackEmoji.radio} LIVE` : formatTime(position);
  const totalTime   = isStream ? '∞'      : formatTime(duration);

  const requesterName = track.requester
    ? `${track.requester.username || track.requester.tag || track.requester}`
    : 'System';

  const loopLabel = player.loop === 'track'
    ? `${blackEmoji.loopTrack} Track`
    : player.loop === 'queue'
      ? `${blackEmoji.loop} Queue`
      : `${blackEmoji.loopOff} Off`;

  const statusLabel = player.paused
    ? `${blackEmoji.pause} Paused`
    : `${blackEmoji.play} Playing`;

  const autoplayOn = player.data.get("autoplay");

  const container = new ContainerBuilder();

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${blackEmoji.music} Now Playing`)
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );

  if (thumbnail) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(thumbnail)
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### [${track.title.substring(0, 100)}](${track.uri})\n` +
      `-# ${blackEmoji.artist} ${track.author.substring(0, 60)}`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${progressBar}\n` +
      `\`${currentTime}\` ─────────── \`${totalTime}\``
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  let statusText = `${blackEmoji.volUp} **Volume:** \`${player.volume}%\`  ${statusLabel}  Loop: ${loopLabel}`;
  if (autoplayOn) {
    statusText += `  ${blackEmoji.autoplay} Autoplay`;
  }
  statusText += `\n${blackEmoji.requester} **Requested by:** ${requesterName}`;

  const nextTrack = player.queue[0];
  if (nextTrack && !nextTrack.isAutoplay) {
    statusText += `\n\n-# ${blackEmoji.upNext} **Up Next:** ${nextTrack.title.substring(0, 55)} — \`${nextTrack.isStream ? 'LIVE' : formatTime(nextTrack.length)}\``;
  } else if (autoplayOn) {
    statusText += `\n\n-# ${blackEmoji.autoplay} **Autoplay** will find the next track`;
  }

  if (player.queue.length > 1) {
    statusText += `\n-# ${blackEmoji.queue} **${player.queue.length}** tracks in queue`;
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(statusText)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${player.guildId}play_pause`)
      .setEmoji(player.paused ? blackEmoji.play : blackEmoji.pause)
      .setLabel(player.paused ? 'Resume' : 'Pause')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${player.guildId}skip`)
      .setEmoji(blackEmoji.skip)
      .setLabel('Skip')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${player.guildId}loop`)
      .setEmoji(blackEmoji.loop)
      .setLabel('Loop')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${player.guildId}like`)
      .setEmoji(blackEmoji.like)
      .setLabel('Like')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${player.guildId}stop`)
      .setEmoji(blackEmoji.stopBtn)
      .setLabel('Stop')
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${player.guildId}previous`)
      .setEmoji(blackEmoji.previous)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${player.guildId}vol_down`)
      .setEmoji(blackEmoji.volDown)
      .setLabel('Vol-')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${player.guildId}vol_up`)
      .setEmoji(blackEmoji.volUp)
      .setLabel('Vol+')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${player.guildId}autoplay`)
      .setEmoji(blackEmoji.autoplay)
      .setLabel('Autoplay')
      .setStyle(autoplayOn ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`${player.guildId}shuffle`)
      .setEmoji(blackEmoji.shuffle)
      .setLabel('Shuffle')
      .setStyle(ButtonStyle.Secondary)
  );

  container.addActionRowComponents(row1, row2);

  return container;
}

module.exports = {
  name: "nowplaying",
  aliases: ['np2', 'current'],
  category: "music",
  description: "Shows the currently playing song with a live progress bar",
  usage: "",
  args: false,
  cooldown: 3,
  userPerms: [],
  botPerms: [],
  voiceChannel: true,

  execute: async (client, message, args, emoji) => {
    const player = await client.getPlayer(message.guild.id);

    if (!player || !player.queue.current) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.no} Nothing is currently playing!`
        )
      );
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const track    = player.queue.current;
    const isStream = track.isStream;

    const msg = await message.reply({
      components: [buildContainer(track, player, client.formatTime, isStream)],
      flags: MessageFlags.IsComponentsV2
    });

    if (!isStream && track.length > 0) {
      let ticks = 0;
      const interval = setInterval(async () => {
        try {
          ticks++;
          if (ticks >= 12) return clearInterval(interval);

          const p = await client.getPlayer(message.guild.id);
          if (!p || !p.queue.current || p.queue.current.uri !== track.uri) {
            return clearInterval(interval);
          }

          await msg.edit({
            components: [buildContainer(track, p, client.formatTime, isStream)],
            flags: MessageFlags.IsComponentsV2
          }).catch(() => clearInterval(interval));
        } catch {
          clearInterval(interval);
        }
      }, 10000);
    }
  }
};
