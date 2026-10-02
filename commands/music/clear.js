const { 
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "clear",
  aliases: ['cq', 'clearqueue'],
  cooldown: "",
  category: "music",
  usage: "",
  description: "clear filter/queue",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, prefix) => {
    const player = await client.getPlayer(message.guild.id);

    let row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("shoukaku_clearFilters")
        .setLabel("Filterㅤ")
        .setEmoji(blackEmoji.cog)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("queue_clear")
        .setLabel("Queueㅤ")
        .setEmoji(blackEmoji.list)
        .setStyle(ButtonStyle.Secondary),
    );

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Clear Options`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Queue tracks:** ${player.queue.length}\n` +
        `${blackEmoji.arrow} Choose what to clear:`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    container.addActionRowComponents(row);
    
    let m = await message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => {});

    const collector = m?.createMessageComponentCollector({
      filter: (i) => {
        if (i.user.id === message.author.id) return true;
        else {
          i.reply({
            ephemeral: true,
            content: `${blackEmoji.no} Only **${message.author.tag}** can use this`,
          })
            .catch((err) => {
              int.deferUpdate();
            })
            .catch(() => {});
          return false;
        }
      },
      time: 60000,
      idle: 30000 / 2,
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.deferred) interaction.deferUpdate();

      const isQueue = interaction.customId.includes("queue");
      const successContainer = new ContainerBuilder();
      successContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Cleared Successfully`)
      );
      successContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      successContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Cleared:** ${isQueue ? 'Queue' : 'Filters'}\n` +
          `${blackEmoji.arrow} **Cleared by:** ${message.author}`
        )
      );

      await player[`${interaction.customId.split("_")[0]}`][
        `${interaction.customId.split("_")[1]}`
      ]();

      await m.edit({ components: [successContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector?.on("end", async (collected, reason) => {
      if (collected.size == 0) {
        const timeoutContainer = new ContainerBuilder();
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.time} Timed Out`)
        );
        timeoutContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} No changes were made\n` +
            `${blackEmoji.arrow} Queue and filters remain unchanged`
          )
        );
        await m.edit({ components: [timeoutContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });
  },
};
