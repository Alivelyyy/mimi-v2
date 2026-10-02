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
  { q: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], answer: 2 },
  { q: "How many legs does a spider have?", options: ["6", "8", "10", "12"], answer: 1 },
  { q: "What planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], answer: 2 },
  { q: "Who painted the Mona Lisa?", options: ["Picasso", "Da Vinci", "Raphael", "Michelangelo"], answer: 1 },
  { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3 },
];

function decodeHtml(str) {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"');
}

function shuffle(arr) {
  return arr.map(v => ({ v, s: Math.random() })).sort((a, b) => a.s - b.s).map(x => x.v);
}

async function fetchTrivia() {
  try {
    const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple", { timeout: 5000 });
    const item = res.data?.results?.[0];
    if (!item) throw new Error("no data");
    const correct = decodeHtml(item.correct_answer);
    const wrong = item.incorrect_answers.map(decodeHtml);
    const all = shuffle([correct, ...wrong]);
    return { q: decodeHtml(item.question), options: all, answer: all.indexOf(correct) };
  } catch (_) {}
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
}

const LABELS = ["A", "B", "C", "D"];
const STYLES = [ButtonStyle.Primary, ButtonStyle.Success, ButtonStyle.Secondary, ButtonStyle.Danger];

module.exports = {
  name: "trivia",
  aliases: ['quiz', 'triviatime'],
  category: "games",
  description: "Answer a live trivia question from Open Trivia DB!",
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
    loadContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Trivia\n${blackEmoji.loading} Loading question...`));
    const msg = await message.reply({ components: [loadContainer], flags: MessageFlags.IsComponentsV2 });

    const item = await fetchTrivia();
    const timeLimit = 20;
    const votes = [0, 0, 0, 0];
    const voted = new Set();

    const buildCard = (locked = false) => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Trivia`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**${item.q}**\n\n` +
        item.options.map((opt, i) => `${LABELS[i]}. ${opt}${locked ? (i === item.answer ?  `${blackEmoji.checkReact}` :  `${blackEmoji.crossReact}`) : ""}`).join("\n") +
        (locked
          ? `\n\n${blackEmoji.arrow} **Votes:** ${item.options.map((_, i) => `${LABELS[i]}: ${votes[i]}`).join(" | ")}`
          : `\n\n${blackEmoji.time} **${timeLimit}s** — pick your answer below!`)
      ));
      if (!locked) {
        c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        c.addActionRowComponents(new ActionRowBuilder().addComponents(
          item.options.map((opt, i) =>
            new ButtonBuilder()
              .setCustomId(`trivia_${i}`)
              .setLabel(`${LABELS[i]}: ${opt.length > 20 ? opt.slice(0, 18) + "…" : opt}`)
              .setStyle(STYLES[i])
          )
        ));
      }
      return c;
    };

    await msg.edit({ components: [buildCard()], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const collector = msg.createMessageComponentCollector({ time: timeLimit * 1000 });

    collector.on("collect", async (interaction) => {
      if (voted.has(interaction.user.id)) {
        return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.no} You already voted!`)
        )], flags: MessageFlags.IsComponentsV2 | 64 }).catch(() => {});
      }
      voted.add(interaction.user.id);
      const choice = parseInt(interaction.customId.split("_")[1]);
      votes[choice]++;
      await interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.yes} Voted for **${LABELS[choice]}: ${item.options[choice]}**!`)
      )], flags: MessageFlags.IsComponentsV2 | 64 }).catch(() => {});
    });

    collector.on("end", async () => {
      await msg.edit({ components: [buildCard(true)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  },
};
