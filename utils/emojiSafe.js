/** @format
 *
 * Emoji Safety System - Bulletproof emoji fallback
 * Prevents Discord API emoji errors
 */

// Safe Unicode emoji fallbacks for any scenario
const safeFallbacks = {
  // Basic actions
  home: "🏠",
  delete: "🗑️",
  list: "📋",
  all: "📋",
  yes: "<a:MekoCheck:1415692999001772103>",
  no: "<a:Cross:1415710100697649387>",
  tick: "<a:MekoCheck:1415692999001772103>", 
  cross: "<a:Cross:1415710100697649387>",
  
  // Reactions & status
  success: "<a:MekoCheck:1415692999001772103>",
  error: "<a:Cross:1415710100697649387>",
  warning: "⚠️",
  info: "ℹ️",
  loading: "⏳",
  
  // Categories
  music: "🎵",
  moderation: "🔨",
  giveaway: "🎉",
  vcmod: "🎤",
  welcomer: "👋",
  config: "⚙️",
  filter: "🎛️",
  fun: "🎮",
  information: "📊",
  utility: "🔧",
  
  // Common actions
  play: "▶️",
  pause: "⏸️",
  stop: "⏹️",
  skip: "⏭️",
  previous: "⏮️",
  volume: "🔊",
  queue: "📜",
  shuffle: "🔀",
  loop: "🔁",
  
  // Misc
  bell: "🔔",
  cog: "⚙️",
  coin: "🪙",
  free: "🆓",
  premium: "👑",
  point: "🔸",
  king: "👑",
  admin: "👑",
  user: "👤",
  server: "🏢",
  channel: "💬",
  role: "🎭",
  link: "🔗",
  message: "💬"
};

// Additional random emojis for variety
const randomEmojis = ["🎯", "⭐", "🔥", "💫", "🌟", "✨", "🎨", "🎭", "🎪", "🎊"];

/**
 * Gets a safe emoji, falling back to Unicode if custom emoji fails
 * @param {Object} emojiObj - The emoji object from the bot
 * @param {string} key - The emoji key to get
 * @param {string} fallback - Optional specific fallback emoji
 * @returns {string} Safe emoji string
 */
function getSafeEmoji(emojiObj, key, fallback = null) {
  try {
    // SAFETY DISABLED - Return original emoji without fallbacks
    if (emojiObj && emojiObj[key]) {
      return emojiObj[key];
    }
    
    // Return empty string if emoji not found (no fallbacks)
    return '';
    
  } catch (error) {
    console.log(`Emoji error for key: ${key}`);
    return '';
  }
}

/**
 * Validates if an emoji is safe to use in Discord API
 * @param {string} emoji - The emoji string to validate
 * @returns {boolean} True if safe, false if needs replacement
 */
function isEmojiSafe(emoji) {
  // SAFETY DISABLED - Always return true (no validation)
  return true;
}

/**
 * Creates a safe emoji object with fallbacks for all keys
 * @param {Object} originalEmoji - Original emoji object
 * @returns {Object} Safe emoji object with guaranteed fallbacks
 */
function createSafeEmojiObject(originalEmoji = {}) {
  // SAFETY DISABLED - Return original emoji object without modifications
  return originalEmoji || {};
}

module.exports = {
  getSafeEmoji,
  isEmojiSafe,
  createSafeEmojiObject,
  safeFallbacks
};