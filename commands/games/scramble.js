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
  "calendar", "diamond", "flamingo", "hospital", "internet",
  "keyboard", "laughter", "mountain", "notebook", "octopus",
  "penguin", "rainbow", "sandwich", "treasure", "universe",
  "volcano", "whisper", "xylophone", "alphabet", "blanket",
];

async function fetchWord() {
  try {
    const res = await axios.get("https://random-word-api.vercel.app/api?words=1&length=7", { timeout: 5000 });
    const word = res.data?.[0];
    if (word && /^[a-z]+$/i.test(word) && word.length >= 4) return word.toLowerCase();
  } catch (_) {}
  return FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
}

function scramble(word) {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join("");
  return result === word ? scramble(word) : result;
}

module.exports = {
  name: "scramble",
  aliases: ['scram', 'wordscramble'],
  category: "games",
  description: "Unscramble the word before time runs out! (live word from API)",
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
    loadContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.search} Word Scramble\n${blackEmoji.loading} Fetching a word...`));
    const gameMsg = await message.reply({ components: [loadContainer], flags: MessageFlags.IsComponentsV2 });

    const word = await fetchWord();
    const scrambled = scramble(word);
    const hint = word[0] + "_".repeat(word.length - 1);
    const timeLimit = 30;

    const gameContainer = new ContainerBuilder();
    gameContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.search} Word Scramble`));
    gameContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    gameContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.arrow} Unscramble this word:\n## \`${scrambled.toUpperCase()}\`\n\n` +
      `${blackEmoji.info} **Hint:** \`${hint}\` (${word.length} letters)\n` +
      `${blackEmoji.time} **${timeLimit}s** — type your answer in this channel!`
    ));
    gameContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    gameContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("scramble_giveup").setLabel("Give Up").setStyle(ButtonStyle.Danger)
    ));
    await gameMsg.edit({ components: [gameContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    let ended = false;

    const msgCollector = message.channel.createMessageCollector({ filter: m => !m.author.bot, time: timeLimit * 1000 });
    const btnCollector = gameMsg.createMessageComponentCollector({ time: timeLimit * 1000 });

    const endGame = async (winner, gaveUp = false) => {
      if (ended) return;
      ended = true;
      msgCollector.stop();
      btnCollector.stop();
      if (winner) {
        await winner.react(blackEmoji.checkReact).catch(() => {});
        await gameMsg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} Correct!\n${blackEmoji.yes} **${winner.author.username}** got it!\n${blackEmoji.arrow} The word was: **${word}**`)
        )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } else {
        await gameMsg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} ${gaveUp ? "Game Over" : "Time's Up!"}\n${blackEmoji.arrow} The word was: **${word}** — scrambled as: \`${scrambled.toUpperCase()}\``)
        )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    };

    msgCollector.on("collect", async m => {
      if (m.content.trim().toLowerCase() === word.toLowerCase()) await endGame(m);
    });
    btnCollector.on("collect", async interaction => {
      await interaction.deferUpdate().catch(() => {});
      await endGame(null, true);
    });
    msgCollector.on("end", (_, r) => { if (r === "time") endGame(null, false); });
  },
};
