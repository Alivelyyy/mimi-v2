const blackEmoji = require("@assets/emojis/black.js");

module.exports = progressBar = (player, size = 15) => {
  const redLine = blackEmoji.heart;
  const whiteLine = blackEmoji.arrow;
  const slider = blackEmoji.music;

  if (!player.queue.current) {
    return `${slider}${whiteLine.repeat(size - 1)}`;
  }

  const current = player.shoukaku.position || 0;
  const total = player.queue.current.length;

  if (current > total) {
    return `${redLine.repeat(size - 1)}${slider}`;
  }

  const progress = Math.round((size - 1) * (current / total));
  const remaining = size - 1 - progress;
  const bar = `${redLine.repeat(progress)}${slider}${whiteLine.repeat(
    remaining,
  )}`;

  return bar;
};
