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
  "What is the most embarrassing thing you've ever done in public?",
  "Have you ever lied to get out of trouble? What did you say?",
  "What is your biggest fear that you've never told anyone?",
  "What is the most childish thing you still do?",
  "Have you ever cheated on a test or game?",
  "What food do you secretly hate but pretend to like?",
  "Have you ever said 'I love you' without meaning it?",
  "What is the pettiest reason you stopped talking to someone?",
  "Have you ever ghosted someone? Why?",
  "What is something you've done that you hope no one ever finds out?",
];

async function fetchTruth() {
  try {
    const res = await axios.get("https://api.truthordaredares.com/?type=truth", { timeout: 5000 });
    if (res.data?.question) return res.data.question;
  } catch (_) {}
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
}

function buildCard(question, loading = false) {
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Truth`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    loading ? `${blackEmoji.loading} Fetching a question...` : `**${question}**`
  ));
  if (!loading) {
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("truth_reroll").setLabel("New Question").setEmoji(blackEmoji.refresh).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("truth_done").setLabel("Done").setStyle(ButtonStyle.Danger)
    ));
  }
  return c;
}

module.exports = {
  name: "truth",
  aliases: ['truth2', 'tt'],
  category: "games",
  description: "Get a random truth question (powered by API)",
  usage: "",
  args: false,
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
    const msg = await message.reply({ components: [buildCard(null, true)], flags: MessageFlags.IsComponentsV2 });
    let question = await fetchTruth();
    await msg.edit({ components: [buildCard(question)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const collector = msg.createMessageComponentCollector({ time: 90_000 });
    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.no} Only **${message.author.username}** can use these.`)
        )], flags: MessageFlags.IsComponentsV2 | 64 }).catch(() => {});
      }
      await interaction.deferUpdate().catch(() => {});
      if (interaction.customId === "truth_reroll") {
        await msg.edit({ components: [buildCard(null, true)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        question = await fetchTruth();
        await msg.edit({ components: [buildCard(question)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } else {
        collector.stop("done");
        await msg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Truth Answered\n**${question}**`)
        )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });
    collector.on("end", (_, r) => {
      if (r === "time") msg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Truth Expired\n**${question}**`)
      )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  },
};
