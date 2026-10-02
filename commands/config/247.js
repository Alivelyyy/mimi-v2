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
  name: "247",
  aliases: ['nonstop', 'alwayson'],
  cooldown: "",
  category: "config",
  usage: "",
  description: "en/dis-able 247 mode",
  args: false,
  vote: true,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: true,
  queue: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, emoji) => {
    const player = await client.getPlayer(message.guild.id);

    let data = await client.db.twoFourSeven.get(
      `${client.user.id}_${message.guild.id}`,
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("enable")
        .setLabel("Enable 24/7")
        .setStyle(ButtonStyle.Success)
        .setDisabled(data ? true : false),
      new ButtonBuilder()
        .setCustomId("disable")
        .setLabel("Disable 24/7")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(data ? false : true),
    );

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji["247"]} 24/7 Mode`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.cog} Current Status\n` +
        `> ${data ? blackEmoji.on : blackEmoji.off} **Status:** ${data ? 'Enabled' : 'Disabled'}\n` +
        (data ? `> ${blackEmoji.channel} **Text:** <#${data.TextId}>\n> ${blackEmoji.mic} **Voice:** <#${data.VoiceId}>` : '') +
        `\n\n### ${blackEmoji.info} About 24/7 Mode\n` +
        `> ${blackEmoji.arrow} Bot stays in voice channel indefinitely\n` +
        `> ${blackEmoji.arrow} Won't leave when queue is empty\n` +
        `> ${blackEmoji.arrow} Perfect for music lounges`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    container.addActionRowComponents(row);

    const m = await message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => {});

    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) {
        return true;
      }
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.warn} Only **${message.author.tag}** can use this`)
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
      idle: 30000 / 2,
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate();

      const resultContainer = new ContainerBuilder();

      if (interaction.customId == "enable") {
        await client.db.twoFourSeven.set(
          `${client.user.id}_${message.guild.id}`,
          {
            TextId: player.textId,
            VoiceId: player.voiceId,
          },
        );
        resultContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.on} **247 mode is now \`Enabled\`**\n` +
            `${blackEmoji.bell} *Set by ${message.author.tag} - (New config)*`
          )
        );
        return await m.edit({ components: [resultContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      await client.db.twoFourSeven.delete(
        `${client.user.id}_${message.guild.id}`,
      );
      resultContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.off} **247 mode is now \`Disabled\`**\n` +
          `${blackEmoji.bell} *Set by ${message.author.tag} - (New config)*`
        )
      );
      await m.edit({ components: [resultContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector?.on("end", async (collected, reason) => {
      if (collected.size == 0) {
        const timeoutContainer = new ContainerBuilder();
        timeoutContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.cool} **Timed out ! Falling back to existing profile**`)
        );
        await m
          .edit({
            components: [timeoutContainer],
            flags: MessageFlags.IsComponentsV2,
          })
          .then(async (fb) =>
            setTimeout(async () => {
              const fallbackContainer = new ContainerBuilder();
              fallbackContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                  data
                    ? `${blackEmoji.on} **247 mode set to \`Enabled\`**\n` +
                      `${blackEmoji.bell} *Timed out! Fell back to existing config*`
                    : `${blackEmoji.off} **247 mode set to \`Disabled\`**\n` +
                      `${blackEmoji.bell} *Timed out! Fell back to existing config*`
                )
              );
              await fb
                .edit({
                  components: [fallbackContainer],
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
