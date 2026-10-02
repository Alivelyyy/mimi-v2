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

const CHOICES = ["rock", "paper", "scissors"];
const EMOJI = { rock: blackEmoji.rock, paper: blackEmoji.paper, scissors: blackEmoji.scissors };

function getResult(player, bot) {
  if (player === bot) return "tie";
  if ((player === "rock" && bot === "scissors") || (player === "paper" && bot === "rock") || (player === "scissors" && bot === "paper")) return "win";
  return "lose";
}

module.exports = {
  name: "rps",
  aliases: ['rockpaperscissors', 'rockpaper'],
  category: "games",
  description: "Play Rock Paper Scissors against the bot!",
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
    const gameContainer = new ContainerBuilder();
    gameContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.game} Rock Paper Scissors`));
    gameContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    gameContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.arrow} Choose your weapon, **${message.author.username}**!\n${blackEmoji.time} You have **15 seconds** to pick.`
    ));
    gameContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    gameContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("rps_rock").setLabel("Rock").setEmoji(blackEmoji.rock).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("rps_paper").setLabel("Paper").setEmoji(blackEmoji.paper).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("rps_scissors").setLabel("Scissors").setEmoji(blackEmoji.scissors).setStyle(ButtonStyle.Secondary)
    ));

    const msg = await message.reply({ components: [gameContainer], flags: MessageFlags.IsComponentsV2 });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 15_000,
      max: 1,
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate().catch(() => {});
      const playerChoice = interaction.customId.split("_")[1];
      const botChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
      const result = getResult(playerChoice, botChoice);

      const resultLine = result === "win"
        ? `${blackEmoji.trophy} **You win!** ${EMOJI[playerChoice]} beats ${EMOJI[botChoice]}`
        : result === "tie"
        ? `${blackEmoji.warn} **It's a tie!** You both picked ${EMOJI[playerChoice]}`
        : `${blackEmoji.no} **Bot wins!** ${EMOJI[botChoice]} beats ${EMOJI[playerChoice]}`;

      const resultContainer = new ContainerBuilder();
      resultContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.game} Rock Paper Scissors`));
      resultContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      resultContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${EMOJI[playerChoice]} **You:** ${playerChoice}\n${EMOJI[botChoice]} **Bot:** ${botChoice}\n\n${resultLine}`
      ));
      await msg.edit({ components: [resultContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        msg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.game} Rock Paper Scissors\n${blackEmoji.warn} Time's up! You didn't pick in time.`)
        )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });
  },
};
