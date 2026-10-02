const { ButtonStyle, ButtonBuilder } = require("discord.js");
const { isEmojiSafe, getSafeEmoji } = require("@utils/emojiSafe.js");

module.exports = class button extends ButtonBuilder {
  makeButton(customId, label, emoji, style, disabled = false) {
    if (!label && !emoji)
      throw new Error("Must provide either label or emoji !");

    this.setCustomId(customId);
    this.setStyle(style);
    this.setDisabled(disabled);
    if (label) this.setLabel(label);
    
    if (emoji) {
      try {
        if (isEmojiSafe(emoji)) {
          this.setEmoji(emoji);
        } else {

          console.log(`Using emoji fallback for button: ${customId}`);
          const safeEmoji = getSafeEmoji(null, customId, "⭐");
          this.setEmoji(safeEmoji);
        }
      } catch (error) {

        console.log(`Emoji error in button ${customId}, using star`);
        this.setEmoji("⭐");
      }
    }
  }

  primary = (customId, label, emoji, disabled) => {
    this.makeButton(customId, label, emoji, ButtonStyle.Primary, disabled);
    return this;
  };

  secondary = (customId, label, emoji, disabled) => {
    this.makeButton(customId, label, emoji, ButtonStyle.Secondary, disabled);
    return this;
  };

  danger = (customId, label, emoji, disabled) => {
    this.makeButton(customId, label, emoji, ButtonStyle.Danger, disabled);
    return this;
  };

  success = (customId, label, emoji, disabled) => {
    this.makeButton(customId, label, emoji, ButtonStyle.Success, disabled);
    return this;
  };

  link = (label, uri) => {
    this.setURL(uri);
    this.setLabel(label);
    this.setStyle(ButtonStyle.Link);
    return this;
  };
};
