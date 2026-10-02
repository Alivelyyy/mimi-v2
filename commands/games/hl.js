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

module.exports = {
  name: "hl",
  aliases: ['highlow', 'hilo'],
  category: "games",
  description: "Is the next number higher or lower? Keep your streak alive!",
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
    let current = Math.floor(Math.random() * 100) + 1;
    let streak = 0;
    const maxRounds = 10;
    let round = 1;
    let ended = false;

    const buildCard = (locked = false, correct = null, next = null) => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.stats} Higher or Lower`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      let content = `${blackEmoji.arrow} **Current number:** \`${current}\`\n${blackEmoji.info} Round **${round}/${maxRounds}** | Streak: **${streak}** ${blackEmoji.fire}`;
      if (locked && correct !== null && next !== null) {
        content += `\n\n${correct ? `${blackEmoji.yes} Correct!` : `${blackEmoji.no} Wrong!`} Next was \`${next}\``;
      } else if (!locked) {
        content += `\n\n${blackEmoji.arrow} Will the next number be **Higher** or **Lower**?`;
      }
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

      if (!locked) {
        c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        c.addActionRowComponents(new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("hl_higher").setEmoji(blackEmoji.higher).setLabel("Higher").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("hl_lower").setEmoji(blackEmoji.lower).setLabel("Lower").setStyle(ButtonStyle.Danger)
        ));
      }
      return c;
    };

    const msg = await message.reply({ components: [buildCard()], flags: MessageFlags.IsComponentsV2 });

    const runRound = () => {
      const collector = msg.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        time: 20_000,
        max: 1,
      });

      collector.on("collect", async (interaction) => {
        if (ended) return;
        await interaction.deferUpdate().catch(() => {});

        const guess = interaction.customId === "hl_higher" ? "higher" : "lower";
        const next = Math.floor(Math.random() * 100) + 1;
        const actuallyHigher = next > current;
        const actuallyLower = next < current;
        const tie = next === current;

        let correct = false;
        if (guess === "higher" && (actuallyHigher || tie)) correct = true;
        if (guess === "lower" && (actuallyLower || tie)) correct = true;

        if (correct) streak++;

        // Show result briefly
        await msg.edit({ components: [buildCard(true, correct, next)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        await new Promise(r => setTimeout(r, 1500));

        if (!correct || round >= maxRounds) {
          ended = true;
          const finalContainer = new ContainerBuilder();
          finalContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            correct
              ? `# ${blackEmoji.trophy} Game Complete!\n${blackEmoji.yes} You survived all **${maxRounds}** rounds!\n${blackEmoji.arrow} Final streak: **${streak}** ${blackEmoji.fire}`
              : `# ${blackEmoji.warn} Game Over!\n${blackEmoji.no} You guessed **${guess}** but it was \`${next}\`.\n${blackEmoji.arrow} Streak: **${streak}** rounds survived!`
          ));
          await msg.edit({ components: [finalContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        } else {
          current = next;
          round++;
          await msg.edit({ components: [buildCard()], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
          runRound();
        }
      });

      collector.on("end", (collected) => {
        if (collected.size === 0 && !ended) {
          ended = true;
          msg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Timed Out!\n${blackEmoji.arrow} You took too long! Streak: **${streak}**`)
          )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
      });
    };

    runRound();
  },
};
