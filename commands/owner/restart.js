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
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "restart",
  aliases: ['rs', 'reboot'],
  cooldown: "",
  category: "owner",
  usage: "",
  description: "Respawns all shards",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: true,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const playing_guilds = [...client.manager.players]
      .map((e) => e[1])
      .filter((p) => p.playing)
      .map((p) => p.guildId);

    let guilds = [];

    for (const id of playing_guilds) {
      let g = await client.guilds.cache.get(id);
      await guilds.push(`${blackEmoji.arrow} ${g.name.substring(0, 15)} - ${g.memberCount} members`);
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Restart Confirmation`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    if (guilds.length === 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.info} No active music players\n\n` +
          `${blackEmoji.arrow} Do you wish to restart all shards?`
        )
      );
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.music} **Active Players:** \`${guilds.length}\`\n\n` +
          `${guilds.join('\n')}\n\n` +
          `${blackEmoji.warn} Restarting will disconnect all players!`
        )
      );
    }
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("restart")
        .setLabel("Restart")
        .setEmoji(blackEmoji.yes)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("end")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger),
    );
    container.addActionRowComponents(row);
    
    let m = await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
    
    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) {
        return true;
      }
      const notAllowedContainer = new ContainerBuilder();
      notAllowedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Only **${message.author.tag}** can use this`)
      );
      await interaction
        .reply({
          components: [notAllowedContainer],
          flags: MessageFlags.IsComponentsV2 | 64,
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
      if (!interaction.deferred) await interaction.deferUpdate();
      switch (interaction.customId) {
        case "restart":
          const restartContainer = new ContainerBuilder();
          restartContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Restarting`)
          );
          restartContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          restartContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} Respawning all shards...\n` +
              `${blackEmoji.time} **ETA:** 10-15 seconds`
            )
          );
          await m
            .edit({
              components: [restartContainer],
              flags: MessageFlags.IsComponentsV2,
            })
            .catch(() => {});
          client.log(`Killing and respawning all shards`, "debug");
          await client.cluster.respawnAll();
          break;
        case "end":
          await collector.stop();
          const cancelContainer = new ContainerBuilder();
          cancelContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Restart Cancelled`)
          );
          cancelContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          cancelContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} Operation cancelled by user`
            )
          );
          await m
            .edit({
              components: [cancelContainer],
              flags: MessageFlags.IsComponentsV2,
            })
            .catch(() => {});
          break;
        default:
          break;
      }
    });

    collector?.on("end", async (collected, reason) => {
      if (collected.size == 0) {
        const timeoutContainer = new ContainerBuilder();
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Restart Confirmation`)
        );
        timeoutContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Command timed out`
          )
        );
        await m
          .edit({
            components: [timeoutContainer],
            flags: MessageFlags.IsComponentsV2,
          })
          .catch(() => {});
      }
    });
  },
};
