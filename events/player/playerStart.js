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
  MessageFlags,
  AttachmentBuilder
} = require("discord.js");
const { RateLimitManager } = require("@sapphire/ratelimits");
const { generatePlayerCard } = require("@gen/playerCard");
const blackEmoji = require('@assets/emojis/black.js');

const adCooldownManager = new RateLimitManager(600000);
const playerMessageCooldown = new RateLimitManager(1500);

module.exports = {
  name: "playerStart",
  run: async (client, player, track) => {
    const guildCooldown = playerMessageCooldown.acquire(`${player.guildId}`);
    const isAutoplayTriggered = player.data.get("autoplay");
    const previousMessage = player.data.get("message");
    
    if (guildCooldown.limited && isAutoplayTriggered && previousMessage) {
      return;
    }

    try {
      guildCooldown.consume();
    } catch (e) {}

    const channel = client.channels.cache.get(player.textId);
    if (!track?.title || !channel) return;

    const { addSongToHistory } = require('@utils/userData');
    let voiceChannel = null;
    try {
      voiceChannel = channel.guild.members.me.voice.channel;
      if (voiceChannel) {
        voiceChannel.members.forEach(member => {
          if (member.user.bot) return;
          try {
            addSongToHistory(member.id, member.user.username, track);
          } catch (e) {}
        });
      }
    } catch (err) {}

    try {
      if (voiceChannel) {
        const songName = track.title.length > 50 ? track.title.substring(0, 47) + '...' : track.title;
        await client.rest.put(`/channels/${voiceChannel.id}/voice-status`, {
          body: { status: `Now playing: ${songName}` }
        }).catch(() => {});
      }
    } catch (err) {}

    player.data.set("trackStartTime", Date.now());
    await player.data.set("autoplaySystem", track);

    let cardAttachment = null;
    try {
      const imgBuffer = await generatePlayerCard(track, player);
      cardAttachment = new AttachmentBuilder(imgBuffer, { name: "playercard.png" });
    } catch (err) {
      console.error("[playerStart] card generation error:", err);
    }

    const container = new ContainerBuilder();
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.music} Now Playing`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    if (cardAttachment) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL("attachment://playercard.png")
        )
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
    }

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

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(infoText)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    const row = new ActionRowBuilder().addComponents(
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

    container.addActionRowComponents(row, row2);

    const sendOptions = {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ...(cardAttachment ? { files: [cardAttachment] } : {})
    };

    let msg;
    try {
      if (isAutoplayTriggered && previousMessage) {
        msg = await previousMessage.edit(sendOptions).catch(async () => {
          return await channel.send(sendOptions);
        });
      } else {
        if (previousMessage) await previousMessage.delete().catch(() => {});
        msg = await channel.send(sendOptions);
      }
    } catch (error) {
      console.error("Error sending playerStart message:", error);
    }

    if (msg) player.data.set("message", msg);

    await client.webhooks.player.send({
      username: client.user.username,
      avatarURL: client.user.displayAvatarURL(),
      components: [
        new client.embed().desc(`**Playing** [${track.title}](${track.uri}) in **${channel.guild.name}**`)
      ],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});
  }
};
