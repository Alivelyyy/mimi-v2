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

const FALLBACK_WORDS = [
  "elephant", "guitar", "pineapple", "umbrella", "butterfly",
  "calendar", "diamond", "flamingo", "mountain", "notebook",
  "octopus", "penguin", "rainbow", "sandwich", "treasure",
];

async function fetchWord() {
  try {
    const res = await axios.get("https://random-word-api.vercel.app/api?words=1&length=6", { timeout: 5000 });
    const word = res.data?.[0];
    if (word && /^[a-z]+$/i.test(word) && word.length >= 4) return word.toLowerCase();
  } catch (_) {}
  return FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
}

const STAGES = [
  "```\n  +---+\n      |\n      |\n      |\n     ===```",
  "```\n  +---+\n  O   |\n      |\n      |\n     ===```",
  "```\n  +---+\n  O   |\n  |   |\n      |\n     ===```",
  "```\n  +---+\n  O   |\n /|   |\n      |\n     ===```",
  "```\n  +---+\n  O   |\n /|\\  |\n      |\n     ===```",
  "```\n  +---+\n  O   |\n /|\\  |\n /    |\n     ===```",
  "```\n  +---+\n  O   |\n /|\\  |\n / \\  |\n     ===```",
];

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

function buildDisplay(word, guessed, wrong) {
  const display = word.split("").map(l => (guessed.includes(l) ? l.toUpperCase() : "_")).join(" ");
  return display;
}

function buildCard(word, guessed, wrong, ended = false, won = false) {
  const stage = STAGES[Math.min(wrong.length, STAGES.length - 1)];
  const display = buildDisplay(word, guessed, wrong);
  const remaining = 6 - wrong.length;

  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.target} Hangman`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `${stage}\n\n**Word:** \`${display}\`\n${blackEmoji.info} **Wrong guesses (${wrong.length}/6):** ${wrong.length > 0 ? wrong.map(l => `\`${l}\``).join(" ") : "none"}\n` +
    (ended
      ? (won ? `\n${blackEmoji.trophy} **You solved it! The word was: ${word.toUpperCase()}**` : `\n${blackEmoji.no} **Game over! The word was: ${word.toUpperCase()}**`)
      : `${blackEmoji.arrow} **Remaining lives:** ${remaining} ${blackEmoji.heart.repeat(remaining)}`)
  ));

  if (!ended) {
    // Split alphabet into rows of 9 buttons (max 5 per row in Discord)
    const available = ALPHABET.filter(l => !guessed.includes(l) && !wrong.includes(l));
    const rows = [];
    for (let i = 0; i < available.length && rows.length < 5; i += 5) {
      const row = new ActionRowBuilder().addComponents(
        available.slice(i, i + 5).map(l =>
          new ButtonBuilder().setCustomId(`hm_${l}`).setLabel(l.toUpperCase()).setStyle(ButtonStyle.Secondary)
        )
      );
      rows.push(row);
    }
    rows.forEach(r => c.addActionRowComponents(r));
  }

  return c;
}

module.exports = {
  name: "hangman",
  aliases: ['hm', 'hang'],
  category: "games",
  description: "Classic hangman — guess the word letter by letter before you run out of lives!",
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
    loadContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.target} Hangman\n${blackEmoji.loading} Picking a word...`));
    const msg = await message.reply({ components: [loadContainer], flags: MessageFlags.IsComponentsV2 });

    const word = await fetchWord();
    const guessed = [];
    const wrong = [];
    let ended = false;

    await msg.edit({ components: [buildCard(word, guessed, wrong)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 5 * 60 * 1000,
    });

    collector.on("collect", async (interaction) => {
      if (ended) return;
      await interaction.deferUpdate().catch(() => {});

      const letter = interaction.customId.split("_")[1];
      if (guessed.includes(letter) || wrong.includes(letter)) return;

      if (word.includes(letter)) {
        guessed.push(letter);
      } else {
        wrong.push(letter);
      }

      const won = word.split("").every(l => guessed.includes(l));
      const lost = wrong.length >= 6;

      if (won || lost) {
        ended = true;
        collector.stop();
        await msg.edit({ components: [buildCard(word, guessed, wrong, true, won)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } else {
        await msg.edit({ components: [buildCard(word, guessed, wrong)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });

    collector.on("end", (_, reason) => {
      if (reason === "time" && !ended) {
        ended = true;
        msg.edit({ components: [buildCard(word, guessed, wrong, true, false)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });
  },
};
