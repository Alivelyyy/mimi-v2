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

// Active games per channel
const activeGames = new Map();

module.exports = {
  name: "gtn",
  aliases: ['guess', 'guessnum'],
  category: "games",
  description: "Bot picks a secret number from 1–300 — first to guess it wins!",
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
    if (activeGames.has(message.channel.id)) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.warn} A Guess the Number game is already running here!\n` +
          `${blackEmoji.arrow} Use the **Stop Game** button on the active message to end it first.`
        )
      );
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    // Bot picks the number — no input from users
    const num = Math.floor(Math.random() * 300) + 1;

    const gameContainer = new ContainerBuilder();
    gameContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Guess the Number!`)
    );
    gameContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    gameContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} I'm thinking of a number between **1** and **300**!\n` +
        `${blackEmoji.arrow} Type your guess in this channel — first to get it right wins!\n` +
        `${blackEmoji.info} Bot will react on the winning message.\n\n` +
        `${blackEmoji.time} Started by **${message.author.username}** — you have **10 minutes**!`
      )
    );
    gameContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    gameContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("gtn_hint")
          .setLabel("Hint")
          .setEmoji(blackEmoji.info)
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("gtn_stop")
          .setLabel("Stop Game")
          .setStyle(ButtonStyle.Danger)
      )
    );

    const gameMsg = await message.channel.send({
      components: [gameContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    activeGames.set(message.channel.id, {
      number: num,
      startedBy: message.author.id,
      msgId: gameMsg.id,
      hintsGiven: 0,
    });

    const msgCollector = message.channel.createMessageCollector({
      filter: (m) => !m.author.bot,
      time: 10 * 60 * 1000,
    });

    const btnCollector = gameMsg.createMessageComponentCollector({
      time: 10 * 60 * 1000,
    });

    let ended = false;

    const endGame = async (winner) => {
      if (ended) return;
      ended = true;
      msgCollector.stop();
      btnCollector.stop();
      activeGames.delete(message.channel.id);

      if (winner) {
        await winner.react(blackEmoji.checkReact).catch(() => {});
        const winContainer = new ContainerBuilder();
        winContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} We Have a Winner!`)
        );
        winContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        winContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.yes} **${winner.author.username}** guessed **${num}** correctly!\n` +
            `${blackEmoji.trophy} Congratulations!`
          )
        );
        await gameMsg.edit({ components: [winContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } else {
        const endedContainer = new ContainerBuilder();
        endedContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ${blackEmoji.warn} Game Over\n` +
            `${blackEmoji.arrow} Nobody guessed it! The number was **${num}**.`
          )
        );
        await gameMsg.edit({ components: [endedContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    };

    msgCollector.on("collect", async (m) => {
      const guess = parseInt(m.content.trim());
      if (!isNaN(guess) && guess === num) {
        await endGame(m);
      }
    });

    btnCollector.on("collect", async (interaction) => {
      const game = activeGames.get(message.channel.id);
      if (!game) return;

      if (interaction.customId === "gtn_hint") {
        await interaction.deferUpdate().catch(() => {});
        game.hintsGiven = (game.hintsGiven || 0) + 1;
        let hint;
        if (game.hintsGiven === 1) hint = num % 2 === 0 ? "It's an **even** number." : "It's an **odd** number.";
        else if (game.hintsGiven === 2) hint = `It's between **${Math.floor(num / 50) * 50 + 1}** and **${Math.floor(num / 50) * 50 + 50}**.`;
        else hint = `It starts with the digit **${String(num)[0]}**.`;

        const hintContainer = new ContainerBuilder();
        hintContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.info} **Hint #${game.hintsGiven}:** ${hint}`)
        );
        await message.channel.send({ components: [hintContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        return;
      }

      if (interaction.customId === "gtn_stop") {
        const canStop =
          interaction.user.id === game.startedBy ||
          interaction.member.permissions.has("Administrator") ||
          interaction.guild.ownerId === interaction.user.id;

        if (!canStop) {
          return interaction.reply({
            components: [new ContainerBuilder().addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.no} Only the game starter or an admin can stop the game.`)
            )],
            flags: MessageFlags.IsComponentsV2 | 64,
          }).catch(() => {});
        }
        await interaction.deferUpdate().catch(() => {});
        await endGame(null);
      }
    });

    msgCollector.on("end", (_, reason) => {
      if (reason === "time") endGame(null);
    });
  },
};
