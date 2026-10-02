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
  name: "loop",
  aliases: ['l', 'repeat'],
  cooldown: "",
  category: "music",
  usage: "",
  description: "set loop mode",
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
  execute: async (client, message, args) => {
    const player = await client.getPlayer(message.guild.id);

    let row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("track")
        .setLabel("Track")
        .setEmoji(blackEmoji.track)
        .setStyle(player.loop == "track" ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("queue")
        .setLabel("Queue")
        .setEmoji(blackEmoji.queue)
        .setStyle(player.loop == "queue" ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("none")
        .setLabel("None")
        .setStyle(player.loop == "none" ? ButtonStyle.Success : ButtonStyle.Secondary),
    );

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.loop} Loop Mode`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Current mode:** ${player.loop}\n` +
        `${blackEmoji.arrow} Select a loop mode below:`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    container.addActionRowComponents(row);

    let m = await message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      })
      .catch(() => {});

    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) {
        return true;
      }
      await interaction
        .reply({
          components: [
            new client.embed().desc(
              `${blackEmoji.no} Only **${message.author.tag}** can use this`,
            ),
          ],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        })
        .catch(() => {});
      return false;
    };
    const collector = m?.createMessageComponentCollector({
      filter: filter,
      time: 60000,
      idle: 30000 / 2,
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.deferred) interaction.deferUpdate();
      await player.setLoop(`${interaction.customId}`);

      const successContainer = new ContainerBuilder();
      successContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          player.loop == "none" ? `# ${blackEmoji.off} Loop Disabled` : `# ${blackEmoji.yes} Loop Enabled`
        )
      );
      successContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      successContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Loop mode:** ${interaction.customId}\n` +
          `${blackEmoji.arrow} **Set by:** ${message.author}`
        )
      );
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
            `${blackEmoji.arrow} Falling back to existing profile...`
          )
        );
        
        await m.edit({ components: [timeoutContainer], flags: MessageFlags.IsComponentsV2 })
          .then(async (fb) =>
            setTimeout(async () => {
              const fallbackContainer = new ContainerBuilder();
              fallbackContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  player.loop == "none" ? `# ${blackEmoji.off} Loop Disabled` : `# ${blackEmoji.yes} Loop Enabled`
                )
              );
              fallbackContainer.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
              );
              fallbackContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `${blackEmoji.arrow} **Loop mode:** ${player.loop}\n` +
                  `${blackEmoji.arrow} Timed out! Fell back to existing config`
                )
              );
              await fb.edit({ components: [fallbackContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }, 2000),
          )
          .catch(() => {});
      }
    });
  },
};
