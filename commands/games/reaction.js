const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'reaction',
  aliases: ['reacttest', 'reactiontime'],
  cooldown: '5',
  category: 'games',
  usage: '',
  description: 'Test your reaction speed — click the button as fast as you can!',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message) => {
    const rounds = 3;
    const times = [];
    let currentRound = 0;
    let ended = false;
    let waitingForGreen = false;
    let greenAt = null;
    let earlyTimeout = null;

    const buildWaiting = (round) => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# \u26a1 Reaction Test — Round ${round}/${rounds}\n\n` +
        `${blackEmoji.arrow} Get ready... **Wait for the green button!**\n` +
        `${blackEmoji.no} Don't click too early!`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('rt_click').setLabel('Wait...').setStyle(ButtonStyle.Danger).setDisabled(false)
      ));
      return c;
    };

    const buildGreen = (round) => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# \u26a1 Reaction Test — Round ${round}/${rounds}\n\n` +
        `### \ud83d\udfe2 CLICK NOW!`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('rt_click').setLabel('CLICK!').setStyle(ButtonStyle.Success)
      ));
      return c;
    };

    const buildResult = (time, round) => {
      let rating;
      if (time < 200) rating = '\ud83c\udfc6 Insane!';
      else if (time < 300) rating = '\u2b50 Fast!';
      else if (time < 400) rating = '\ud83d\udc4d Good';
      else if (time < 600) rating = '\ud83d\ude10 Average';
      else rating = '\ud83d\udc22 Slow';

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# \u26a1 Reaction Test — Round ${round}/${rounds}\n\n` +
        `${blackEmoji.yes} **${time}ms** — ${rating}\n` +
        times.map((t, i) => `${blackEmoji.arrow} Round ${i + 1}: **${t}ms**`).join('\n') +
        (round < rounds ? `\n\n${blackEmoji.info} Next round starting...` : '')
      ));
      return c;
    };

    const buildFinal = () => {
      const avg = Math.round(times.reduce((s, t) => s + t, 0) / times.length);
      const best = Math.min(...times);
      let overallRating;
      if (avg < 200) overallRating = '\ud83c\udfc6 Lightning reflexes!';
      else if (avg < 300) overallRating = '\u2b50 Very fast!';
      else if (avg < 400) overallRating = '\ud83d\udc4d Above average';
      else if (avg < 500) overallRating = '\ud83d\ude10 Average';
      else overallRating = '\ud83d\udc22 Keep practicing!';

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# \u26a1 Reaction Test — Results`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        times.map((t, i) => `${blackEmoji.arrow} Round ${i + 1}: **${t}ms**`).join('\n') +
        `\n\n${blackEmoji.info} **Average:** ${avg}ms\n${blackEmoji.trophy} **Best:** ${best}ms\n${blackEmoji.arrow} **Rating:** ${overallRating}`
      ));
      return c;
    };

    const startRound = async (gameMsg) => {
      currentRound++;
      waitingForGreen = true;
      greenAt = null;

      await gameMsg.edit({ components: [buildWaiting(currentRound)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

      const delay = 1500 + Math.floor(Math.random() * 3000);
      earlyTimeout = setTimeout(async () => {
        if (ended) return;
        waitingForGreen = false;
        greenAt = Date.now();
        await gameMsg.edit({ components: [buildGreen(currentRound)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }, delay);
    };

    const gameMsg = await message.reply({ components: [buildWaiting(1)], flags: MessageFlags.IsComponentsV2 });

    currentRound = 1;
    waitingForGreen = true;
    const delay = 1500 + Math.floor(Math.random() * 3000);
    earlyTimeout = setTimeout(async () => {
      if (ended) return;
      waitingForGreen = false;
      greenAt = Date.now();
      await gameMsg.edit({ components: [buildGreen(currentRound)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }, delay);

    const collector = gameMsg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on('collect', async (interaction) => {
      if (ended) return;
      await interaction.deferUpdate().catch(() => {});

      if (waitingForGreen) {
        clearTimeout(earlyTimeout);
        const earlyC = new ContainerBuilder();
        earlyC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# \u26a1 Reaction Test\n\n${blackEmoji.no} **Too early!** You clicked before the green button appeared.\n${blackEmoji.info} Restarting round...`
        ));
        await gameMsg.edit({ components: [earlyC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        await new Promise(r => setTimeout(r, 1500));
        await startRound(gameMsg);
        return;
      }

      const time = Date.now() - greenAt;
      times.push(time);

      if (currentRound >= rounds) {
        ended = true;
        collector.stop();
        await gameMsg.edit({ components: [buildResult(time, currentRound)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));
        await gameMsg.edit({ components: [buildFinal()], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      } else {
        await gameMsg.edit({ components: [buildResult(time, currentRound)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));
        await startRound(gameMsg);
      }
    });

    collector.on('end', () => {
      if (!ended) {
        ended = true;
        clearTimeout(earlyTimeout);
        if (times.length > 0) {
          gameMsg.edit({ components: [buildFinal()], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        } else {
          gameMsg.edit({ components: [new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# \u26a1 Reaction Test\n${blackEmoji.info} Timed out — no rounds completed.`)
          )], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
      }
    });
  }
};
