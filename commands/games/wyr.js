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
  ["Have unlimited money but never find true love", "Have true love but always be broke"],
  ["Be able to fly but only at walking speed", "Teleport but only to places you've been before"],
  ["Know when you'll die but not how", "Know how you'll die but not when"],
  ["Always be 10 minutes late", "Always be 20 minutes early"],
  ["Have free Wi-Fi wherever you go", "Have free food wherever you go"],
  ["Give up social media forever", "Give up music forever"],
  ["Speak every language fluently", "Play every instrument perfectly"],
  ["Live without your phone for a year", "Live without music for a year"],
  ["Always have to sing instead of talk", "Always have to dance instead of walk"],
  ["Be the smartest person in the room", "Be the funniest person in the room"],
  ["Have a photographic memory", "Be able to forget anything you choose"],
  ["Live in a world with no internet", "Live in a world with no cars"],
  ["Age only from the neck up", "Age only from the neck down"],
  ["Read minds", "Become invisible at will"],
  ["Travel to the past and meet your ancestors", "Travel to the future 100 years from now"],
  ["Have a rewind button for your life", "Have a pause button for your life"],
  ["Be able to breathe underwater", "Survive without sleep"],
  ["Have a dragon as a pet", "Be best friends with a wizard"],
  ["Lose all memories from the last 10 years", "Lose the ability to make new memories"],
  ["Be famous but disliked by everyone", "Be unknown but loved by close ones"],
];

async function fetchWYR() {
  try {
    const res = await axios.get("https://would-you-rather-api.abaanshanid.repl.co/", { timeout: 5000 });
    const q = res.data?.question || res.data;
    if (typeof q === "string" && q.includes(" OR ")) {
      const parts = q.split(" OR ");
      if (parts.length === 2) return [parts[0].replace(/^Would you rather /i, "").trim(), parts[1].trim()];
    }
  } catch (_) {}
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
}

module.exports = {
  name: "wyr",
  aliases: ['wouldyourather', 'or'],
  category: "games",
  description: "Vote on a Would You Rather question!",
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
    loadContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Would You Rather\n${blackEmoji.loading} Loading...`));
    const gameMsg = await message.reply({ components: [loadContainer], flags: MessageFlags.IsComponentsV2 });

    const [optA, optB] = await fetchWYR();
    const votes = { A: 0, B: 0 };
    const voted = new Set();
    const timeLimit = 30;

    const buildCard = (locked = false) => {
      const total = votes.A + votes.B;
      const pA = total > 0 ? Math.round((votes.A / total) * 100) : 0;
      const pB = total > 0 ? Math.round((votes.B / total) * 100) : 0;

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Would You Rather`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.optionA} **${optA}**\n\n**OR**\n\n${blackEmoji.optionB} **${optB}**` +
        (locked
          ? `\n\n${blackEmoji.arrow} **Results (${total} votes):**\n${blackEmoji.optionA} ${pA}% — ${votes.A} vote${votes.A !== 1 ? "s" : ""}\n${blackEmoji.optionB} ${pB}% — ${votes.B} vote${votes.B !== 1 ? "s" : ""}`
          : `\n\n${blackEmoji.time} **${timeLimit}s** to vote — tap a button below!`)
      ));
      if (!locked) {
        c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        c.addActionRowComponents(new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("wyr_A").setEmoji(blackEmoji.optionA).setLabel("Option A").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("wyr_B").setEmoji(blackEmoji.optionB).setLabel("Option B").setStyle(ButtonStyle.Secondary)
        ));
      }
      return c;
    };

    await gameMsg.edit({ components: [buildCard()], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const collector = gameMsg.createMessageComponentCollector({ time: timeLimit * 1000 });

    collector.on("collect", async (interaction) => {
      if (voted.has(interaction.user.id)) {
        return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.no} You already voted!`)
        )], flags: MessageFlags.IsComponentsV2 | 64 }).catch(() => {});
      }
      voted.add(interaction.user.id);
      const choice = interaction.customId.split("_")[1];
      votes[choice]++;
      await interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.yes} Voted for **${choice === "A" ? `${blackEmoji.optionA} ${optA}` : `${blackEmoji.optionB} ${optB}`}**!`)
      )], flags: MessageFlags.IsComponentsV2 | 64 }).catch(() => {});
      await gameMsg.edit({ components: [buildCard()], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector.on("end", async () => {
      await gameMsg.edit({ components: [buildCard(true)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  },
};
