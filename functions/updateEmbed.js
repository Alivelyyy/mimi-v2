const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = updateEmbed = async (client, player) => {
  const message = player.data.get("message");
  if (!message) return;
  
  try {
    const track = player.queue.current;
    if (!track) return;

    const duration = track.isStream ? `${blackEmoji.radio} LIVE` : client.formatTime(track.length);
    const requesterName = track.requester
      ? `\`${track.requester.username || track.requester.tag || track.requester}\``
      : 'System';

    const loopMode = player.loop === 'track' ? `${blackEmoji.loopTrack} Track` : player.loop === 'queue' ? `${blackEmoji.loop} Queue` : `${blackEmoji.loopOff} Off`;
    const autoplayOn = player.data.get("autoplay");

    let infoText = `### [${track.title.substring(0, 100)}](${track.uri})\n` +
      `-# ${blackEmoji.artist} ${track.author.substring(0, 50)}\n\n` +
      `${blackEmoji.time} \`${duration}\` ─ ${blackEmoji.volUp} \`${player.volume}%\` ─ Loop: ${loopMode}`;

    if (autoplayOn) {
      infoText += ` ─ ${blackEmoji.autoplay} Autoplay`;
    }

    infoText += `\n${blackEmoji.requester} Requested by ${requesterName}`;

    const nextTrack = player.queue[0];
    if (nextTrack && !nextTrack.isAutoplay) {
      infoText += `\n\n-# ${blackEmoji.upNext} **Up Next:** ${nextTrack.title.substring(0, 60)} — \`${nextTrack.isStream ? 'LIVE' : client.formatTime(nextTrack.length)}\``;
    } else if (autoplayOn) {
      infoText += `\n\n-# ${blackEmoji.autoplay} **Autoplay** will find the next track`;
    }

    if (player.queue.length > 1) {
      infoText += `\n-# ${blackEmoji.queue} **${player.queue.length}** tracks in queue`;
    }

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.music} Now Playing`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(infoText)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${player.guildId}play_pause`).setEmoji(player.paused ? blackEmoji.play : blackEmoji.pause).setLabel(player.paused ? "Play" : "Pause").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${player.guildId}skip`).setEmoji(blackEmoji.skip).setLabel("Skip").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${player.guildId}stop`).setEmoji(blackEmoji.stopBtn).setLabel("Stop").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`${player.guildId}loop`).setEmoji(blackEmoji.loop).setLabel("Loop").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${player.guildId}shuffle`).setEmoji(blackEmoji.shuffle).setLabel("Shuffle").setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${player.guildId}vol_down`).setEmoji(blackEmoji.volDown).setLabel("Vol-").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${player.guildId}vol_up`).setEmoji(blackEmoji.volUp).setLabel("Vol+").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${player.guildId}replay`).setEmoji(blackEmoji.replay).setLabel("Replay").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${player.guildId}autoplay`).setEmoji(blackEmoji.autoplay).setLabel("Autoplay").setStyle(autoplayOn ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${player.guildId}like`).setEmoji(blackEmoji.like).setLabel("Like").setStyle(ButtonStyle.Secondary)
    );

    container.addActionRowComponents(row1, row2);

    await message.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});
  } catch (err) {
    console.error('Error updating embed:', err.message);
  }
};
