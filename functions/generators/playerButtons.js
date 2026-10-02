const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

function resolveEmoji(emoji) {
  if (!emoji) return undefined;
  if (typeof emoji === "object") return emoji;
  if (typeof emoji === "string" && emoji.includes(":")) {
    const match = emoji.match(/<?(a)?:?(\w+):(\d+)>?/);
    if (!match) return emoji;
    return { name: match[2], id: match[3], animated: Boolean(match[1]) };
  }
  return emoji;
}

module.exports = (client, player, number = 5) => {
  const guildId = player?.guildId || "";

  const row1 = new ActionRowBuilder();
  const row2 = new ActionRowBuilder();

  if (number === 4) {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`${guildId}previous`)
        .setEmoji(resolveEmoji(blackEmoji.previous))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`${guildId}play_pause`)
        .setEmoji(resolveEmoji(player?.paused ? blackEmoji.play : blackEmoji.pause))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`${guildId}skip`)
        .setEmoji(resolveEmoji(blackEmoji.skip))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`${guildId}stop`)
        .setEmoji(resolveEmoji(blackEmoji.stopBtn))
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`${guildId}loop`)
        .setEmoji(resolveEmoji(blackEmoji.loop))
        .setStyle(player?.loop === "track" ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`${guildId}like`)
        .setEmoji(resolveEmoji(blackEmoji.like))
        .setStyle(ButtonStyle.Secondary)
    );
  } else if (number === 5 || number === 6) {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`${guildId}previous`)
        .setEmoji(resolveEmoji(blackEmoji.previous))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`${guildId}play_pause`)
        .setEmoji(resolveEmoji(player?.paused ? blackEmoji.play : blackEmoji.pause))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`${guildId}skip`)
        .setEmoji(resolveEmoji(blackEmoji.skip))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`${guildId}stop`)
        .setEmoji(resolveEmoji(blackEmoji.stopBtn))
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`${guildId}loop`)
        .setEmoji(resolveEmoji(blackEmoji.loop))
        .setStyle(player?.loop === "track" ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`${guildId}like`)
        .setEmoji(resolveEmoji(blackEmoji.like))
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return [row1, row2];
};
