
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
  name: "prefix",
  aliases: ['pfx', 'px'],
  cooldown: "",
  category: "config",
  usage: "<reset/pfx>",
  description: "set/reset prefix",
  args: true,
  vote: true,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    if (!args[0]) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.cross} **Please provide a prefix or use \`reset\` to reset**`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    let pfx = args[0].toLowerCase() === "reset" ? client.prefix : args[0];
    
    // Validate prefix
    if (pfx.length > 5) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.cross} **Prefix cannot be longer than 5 characters**`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.cog} **Prefix will be set to \`${pfx}\`**\n` +
          `*Choose your desired option below*`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("guild")
        .setLabel("Guild")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("author")
        .setLabel("User")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel(blackEmoji.closeX)
        .setStyle(ButtonStyle.Danger)
    );
    container.addActionRowComponents(row);

    const m = await message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);

    if (!m) return;

    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) {
        return true;
      }
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.cross} Only **${message.author.tag}** can use this`)
      );
      await interaction
        .reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true,
        })
        .catch(() => {});
      return false;
    };
    
    const collector = m?.createMessageComponentCollector({
      filter: filter,
      time: 60000,
      idle: 30000,
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate().catch(() => {});
        
      if (interaction.customId === "guild" && !message.member?.permissions?.has("ManageGuild")) {
        const permContainer = new ContainerBuilder();
        permContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.bell} You don't have permissions to manage the guild prefix`)
        );
        return await interaction.followUp({
          components: [permContainer],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true
        }).catch(() => {});
      }

      if (interaction.customId === "cancel") {
        await collector.stop();
        return;
      }

      try {
        const targetId = interaction.customId === "guild" ? message.guild.id : message.author.id;
        
        if (args[0].toLowerCase() === "reset") {
          await client.db.pfx.delete(`${client.user.id}_${targetId}`);
        } else {
          await client.db.pfx.set(`${client.user.id}_${targetId}`, pfx);
        }

        const successContainer = new ContainerBuilder();
        successContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.yes} Set ${interaction.customId} prefix to \`${pfx}\``)
        );

        await m.edit({
          components: [successContainer],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
        
        await collector.stop();
      } catch (error) {
        console.error("Prefix command error:", error);
        const errorContainer = new ContainerBuilder();
        errorContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.cross} Failed to update prefix. Please try again.`)
        );
        await interaction.followUp({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
          ephemeral: true
        }).catch(() => {});
      }
    });

    collector?.on("end", async (collected, reason) => {
      let selected = [...collected].map((ele) => ele[1].customId);
      if (collected.size === 0 || selected.includes("cancel")) {
        const rollbackContainer = new ContainerBuilder();
        rollbackContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.cool} **Rolling back changes**`)
        );

        await m
          .edit({
            components: [rollbackContainer],
            flags: MessageFlags.IsComponentsV2,
          })
          .then(async (fb) =>
            setTimeout(async () => {
              const finalContainer = new ContainerBuilder();
              finalContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${blackEmoji.bell} *No changes made to prefix config*`)
              );

              await fb
                .edit({
                  components: [finalContainer],
                  flags: MessageFlags.IsComponentsV2,
                })
                .catch(() => {});
            }, 2000),
          )
          .catch(() => {});
      }
    });
  },
};
