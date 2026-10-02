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
  name: "autoplay",
  aliases: ['ap', 'autoq'],
  cooldown: "",
  category:  "music",
  usage: "",
  description: "en/dis-able autoplay",
  args: false,
  vote: true,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms:  [],
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel:  true,
  execute: async (client, message, args, prefix) => {
    let player = await client.getPlayer(message.guild.id);

    let data = player.data.get("autoplay");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("enable")
        .setLabel("Enable")
        .setStyle(ButtonStyle.Success)
        .setDisabled(data ? true : false),
      new ButtonBuilder()
        .setCustomId("disable")
        .setLabel("Disable")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(data ? false : true),
    );
    
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.autoplay} Autoplay Mode`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Current status:** ${data ? 'Enabled' : 'Disabled'}\n` +
        `${blackEmoji.arrow} Autoplay adds similar songs when queue ends\n` +
        `${blackEmoji.arrow} Choose an option below:`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize. Small)
    );
    container.addActionRowComponents(row);
    
    const m = await message
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
    const collector = m?. createMessageComponentCollector({
      filter: filter,
      time:  60000,
      idle:  30000 / 2,
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate();

      if (interaction.customId == "enable") {
        player.data.set("autoplay", true);
        const currentTrack = player.queue.current || player.data.get("autoplaySystem");
        player.data.set("autoplaySystem", currentTrack);
        
        // Store the original source name to preserve it across tracks
        if (currentTrack) {
          player.data.set("autoplayOriginalSource", currentTrack.sourceName);
        }
        
        const enableContainer = new ContainerBuilder();
        enableContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Autoplay Enabled`)
        );
        enableContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        enableContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Similar songs will be added automatically\n` +
            `${blackEmoji.arrow} **Enabled by:** ${message.author}`
          )
        );
        await require("@functions/updateEmbed.js")(client, player);
        return await m.edit({ components: [enableContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      player.data.set("autoplay", false);
      player.data.delete("autoplayOriginalSource"); // Clear stored source when disabling
      
      const disableContainer = new ContainerBuilder();
      disableContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.off} Autoplay Disabled`)
      );
      disableContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      disableContainer. addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Autoplay has been turned off\n` +
          `${blackEmoji.arrow} **Disabled by:** ${message.author}`
        )
      );
      await require("@functions/updateEmbed.js")(client, player);
      return await m.edit({ components: [disableContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector?.on("end", async (collected, reason) => {
      if (collected.size == 0) {
        const timeoutContainer = new ContainerBuilder();
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.time} Timed Out`)
        );
        timeoutContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize. Small)
        );
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Falling back to existing profile...`
          )
        );
        
        await m.edit({ components: [timeoutContainer], flags: MessageFlags.IsComponentsV2 })
          .then(async (fb) => {
            player = await client. getPlayer(message.guild.id);
            setTimeout(async () => {
              const fallbackContainer = new ContainerBuilder();
              fallbackContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  player?.data.get("autoplay") 
                    ? `# ${blackEmoji.yes} Autoplay Enabled` 
                    : `# ${blackEmoji.off} Autoplay Disabled`
                )
              );
              fallbackContainer.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
              );
              fallbackContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  `${blackEmoji.arrow} Timed out! Fell back to existing config`
                )
              );
              await fb.edit({ components: [fallbackContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }, 2000);
          })
          .catch(() => {});
      }
    });
  },
};