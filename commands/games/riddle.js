const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");
const axios = require("axios");

const FALLBACK = [
  { riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "An echo" },
  { riddle: "The more you take, the more you leave behind. What am I?", answer: "Footsteps" },
  { riddle: "I have cities, but no houses live there. I have mountains, but no trees grow. I have water, but no fish swim. What am I?", answer: "A map" },
  { riddle: "What has hands but can't clap?", answer: "A clock" },
  { riddle: "What gets wetter the more it dries?", answer: "A towel" },
  { riddle: "I have a head and a tail, but no body. What am I?", answer: "A coin" },
  { riddle: "What can travel around the world while staying in a corner?", answer: "A stamp" },
  { riddle: "What has many keys but can't open a single lock?", answer: "A piano" },
  { riddle: "What goes up but never comes down?", answer: "Your age" },
  { riddle: "I'm light as a feather, but the strongest person can't hold me for more than 5 minutes. What am I?", answer: "Breath" },
];

async function fetchRiddle() {
  try {
    const res = await axios.get("https://riddles-api.vercel.app/random", { timeout: 5000 });
    if (res.data?.riddle && res.data?.answer) return { riddle: res.data.riddle, answer: res.data.answer };
  } catch (_) {}
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
}

module.exports = {
  name: "riddle",
  aliases: ['rid', 'puzzle'],
  category: "games",
  description: "Try to solve a riddle! Answer reveals after 45 seconds or when you give up.",
  usage: "",
  args: false,
  cooldown: 5,
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
    const loadContainer = new ContainerBuilder();
    loadContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Riddle\n${blackEmoji.loading} Fetching a riddle...`));
    const msg = await message.reply({ components: [loadContainer], flags: MessageFlags.IsComponentsV2 });

    const { riddle, answer } = await fetchRiddle();
    const timeLimit = 45;

    const riddleContainer = new ContainerBuilder();
    riddleContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Riddle`));
    riddleContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    riddleContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**${riddle}**\n\n${blackEmoji.time} **${timeLimit}s** — type your answer in this channel, or click Reveal!`
    ));
    riddleContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    riddleContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("riddle_reveal").setLabel("Reveal Answer").setEmoji(blackEmoji.info).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("riddle_giveup").setLabel("Give Up").setStyle(ButtonStyle.Danger)
    ));
    await msg.edit({ components: [riddleContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    let ended = false;
    const normalizedAnswer = answer.replace(/^(a |an |the )/i, "").trim().toLowerCase();

    const msgCollector = message.channel.createMessageCollector({ filter: m => !m.author.bot, time: timeLimit * 1000 });
    const btnCollector = msg.createMessageComponentCollector({ time: timeLimit * 1000 });

    const endGame = async (winner, revealed = false) => {
      if (ended) return;
      ended = true;
      msgCollector.stop();
      btnCollector.stop();
      if (winner) {
        await winner.react(blackEmoji.checkReact).catch(() => {});
        await msg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ${blackEmoji.trophy} Solved!\n${blackEmoji.yes} **${winner.author.username}** got it!\n${blackEmoji.arrow} **Answer:** ${answer}`
          )
        )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } else {
        await msg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ${blackEmoji.info} Riddle — Answer${revealed ? "" : " (Time's Up!)"}\n**${riddle}**\n\n${blackEmoji.arrow} **Answer:** ${answer}`
          )
        )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    };

    msgCollector.on("collect", async m => {
      const guess = m.content.trim().toLowerCase().replace(/^(a |an |the )/i, "");
      if (guess === normalizedAnswer || guess.includes(normalizedAnswer) || normalizedAnswer.includes(guess)) {
        await endGame(m);
      }
    });

    btnCollector.on("collect", async interaction => {
      await interaction.deferUpdate().catch(() => {});
      await endGame(null, true);
    });

    msgCollector.on("end", (_, r) => { if (r === "time") endGame(null, false); });
  },
};
