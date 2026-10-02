const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags
} = require("discord.js");
const axios = require("axios");
const blackEmoji = require("@assets/emojis/black.js");

const fallbackAdvice = [
  "Be yourself; everyone else is already taken.",
  "Life is what happens to you while you're busy making other plans.",
  "The only way to do great work is to love what you do.",
  "Innovation distinguishes between a leader and a follower.",
  "Stay hungry, stay foolish.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Don't let yesterday take up too much of today.",
  "You miss 100% of the shots you don't take.",
  "Whether you think you can or you think you can't, you're right.",
  "The only impossible journey is the one you never begin.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "What lies behind us and what lies before us are tiny matters compared to what lies within us."
];

module.exports = {
  name: "advice",
  aliases: ['tip', 'randomadvice'],
  category: "fun",
  description: "Get a random piece of life advice",
  execute: async (client, message, args, emoji) => {
    try {
      const response = await axios.get("https://api.adviceslip.com/advice");
      const advice = response.data.slip.advice;
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.bulb} **Life Advice**\n*"${advice}"*`)
      );
      message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error("Advice command error:", error);
      const randomAdvice = fallbackAdvice[Math.floor(Math.random() * fallbackAdvice.length)];
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.bulb} **Life Advice**\n*"${randomAdvice}"*`)
      );
      message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  }
};
