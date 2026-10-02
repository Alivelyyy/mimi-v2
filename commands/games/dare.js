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
  "Do your best impression of a famous person in this server.",
  "Send a voice message singing the first 10 seconds of a song.",
  "Write a dramatic love poem about your least favourite food.",
  "Type your next three messages using only your nose.",
  "Speak like a pirate in this chat for the next 5 minutes.",
  "Write a haiku about the last person who messaged you.",
  "Send your most used emoji 50 times in a row.",
  "Text someone 'we need to talk' and screenshot their reply.",
  "Change your profile picture to a meme for 15 minutes.",
  "Say 'banana' at the end of every sentence for 5 minutes.",
];

async function fetchDare() {
  try {
    const res = await axios.get("https://api.truthordaredares.com/?type=dare", { timeout: 5000 });
    if (res.data?.question) return res.data.question;
  } catch (_) {}
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
}

function buildCard(dare, loading = false) {
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.danger} Dare`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    loading ? `${blackEmoji.loading} Fetching a dare...` : `**${dare}**`
  ));
  if (!loading) {
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("dare_reroll").setLabel("New Dare").setEmoji(blackEmoji.refresh).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("dare_done").setLabel("Completed!").setStyle(ButtonStyle.Success)
    ));
  }
  return c;
}

module.exports = {
  name: "dare",
  aliases: ['dare2', 'td'],
  category: "games",
  description: "Get a random dare challenge (powered by API)",
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
    let dare = await fetchDare();
    await msg.edit({ components: [buildCard(dare)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const collector = msg.createMessageComponentCollector({ time: 90_000 });
    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.no} Only **${message.author.username}** can use these.`)
        )], flags: MessageFlags.IsComponentsV2 | 64 }).catch(() => {});
      }
      await interaction.deferUpdate().catch(() => {});
      if (interaction.customId === "dare_reroll") {
        await msg.edit({ components: [buildCard(null, true)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        dare = await fetchDare();
        await msg.edit({ components: [buildCard(dare)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } else {
        collector.stop("done");
        await msg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Dare Completed!\n${blackEmoji.arrow} **${dare}**\n\n${blackEmoji.trophy} Well done, **${message.author.username}**!`)
        )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });
    collector.on("end", (_, r) => {
      if (r === "time") msg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Dare Expired\n**${dare}**`)
      )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  },
};
