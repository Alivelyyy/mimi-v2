const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");
const axios = require("axios");

const FALLBACK = [
  { text: "It is certain.", positive: true },
  { text: "It is decidedly so.", positive: true },
  { text: "Without a doubt.", positive: true },
  { text: "Yes, definitely!", positive: true },
  { text: "You may rely on it.", positive: true },
  { text: "As I see it, yes.", positive: true },
  { text: "Most likely.", positive: true },
  { text: "Outlook good.", positive: true },
  { text: "Signs point to yes.", positive: true },
  { text: "Absolutely!", positive: true },
  { text: "Reply hazy, try again.", positive: null },
  { text: "Ask again later.", positive: null },
  { text: "Better not tell you now.", positive: null },
  { text: "Cannot predict now.", positive: null },
  { text: "Concentrate and ask again.", positive: null },
  { text: "The stars are unclear...", positive: null },
  { text: "Don't count on it.", positive: false },
  { text: "My reply is no.", positive: false },
  { text: "My sources say no.", positive: false },
  { text: "Outlook not so good.", positive: false },
  { text: "Very doubtful.", positive: false },
  { text: "I wouldn't bet on it.", positive: false },
];

async function fetchAnswer(question) {
  try {
    const res = await axios.get(`https://eightballapi.com/api?question=${encodeURIComponent(question)}&lucky=false`, { timeout: 5000 });
    if (res.data?.reading) return { text: res.data.reading, positive: null };
  } catch (_) {}
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
}

module.exports = {
  name: "8ball",
  aliases: ['8b', 'magicball'],
  category: "games",
  description: "Ask the magic 8 ball a yes/no question (powered by API)",
  usage: "<question>",
  args: true,
  cooldown: 3,
  owner: false,
  vote: false,
  new: false,
  admin: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,

  execute: async (client, message, args, emoji) => {
    const question = args.join(" ");

    const loadContainer = new ContainerBuilder();
    loadContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.eightball} Magic 8 Ball\n${blackEmoji.loading} Consulting the ball...`));
    const msg = await message.reply({ components: [loadContainer], flags: MessageFlags.IsComponentsV2 });

    const response = await fetchAnswer(question);
    const indicator = response.positive === true ? blackEmoji.positive : response.positive === false ? blackEmoji.negative : blackEmoji.neutral;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.eightball} Magic 8 Ball`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.arrow} **Question:** ${question}\n\n${indicator} **Answer:** *${response.text}*`
    ));

    await msg.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  },
};
