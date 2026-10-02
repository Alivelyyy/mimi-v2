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

function generateQuestion(difficulty = "medium") {
  const ops = ["+", "-", "*"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer, question;

  if (op === "+") {
    a = Math.floor(Math.random() * 900) + 100;
    b = Math.floor(Math.random() * 900) + 100;
    answer = a + b; question = `${a} + ${b}`;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 900) + 200;
    b = Math.floor(Math.random() * (a - 1)) + 1;
    answer = a - b; question = `${a} - ${b}`;
  } else {
    a = Math.floor(Math.random() * 30) + 2;
    b = Math.floor(Math.random() * 30) + 2;
    answer = a * b; question = `${a} × ${b}`;
  }
  return { question, answer };
}

module.exports = {
  name: "fastmath",
  aliases: ['fm', 'mathquiz'],
  category: "games",
  description: "Race to solve a math problem first!",
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
    const { question, answer } = generateQuestion();
    const timeLimit = 20;

    const gameContainer = new ContainerBuilder();
    gameContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.stats} Fast Math`));
    gameContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    gameContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.arrow} First to type the correct answer wins!\n\n## \`${question} = ?\`\n\n` +
      `${blackEmoji.time} **${timeLimit}s** — type the answer in this channel!`
    ));
    gameContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    gameContainer.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("fastmath_giveup").setLabel("Give Up").setStyle(ButtonStyle.Danger)
    ));

    const gameMsg = await message.reply({ components: [gameContainer], flags: MessageFlags.IsComponentsV2 });
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
          new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} Correct!\n${blackEmoji.yes} **${winner.author.username}** solved it first!\n${blackEmoji.arrow} **${question} = ${answer}**\n${blackEmoji.trophy} Math genius!`)
        )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } else {
        await gameMsg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} ${gaveUp ? "Game Over" : "Time's Up!"}\n${blackEmoji.arrow} The answer was: **${answer}**\n**${question} = ${answer}**`)
        )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    };

    msgCollector.on("collect", async m => {
      if (parseInt(m.content.trim()) === answer) await endGame(m);
    });
    btnCollector.on("collect", async interaction => {
      await interaction.deferUpdate().catch(() => {});
      await endGame(null, true);
    });
    msgCollector.on("end", (_, r) => { if (r === "time") endGame(null, false); });
  },
};
