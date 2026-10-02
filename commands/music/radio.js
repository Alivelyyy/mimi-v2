const generate = require("@gen/radio.js");
const radio = require("@assets/radioLinks.js");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "radio",
  aliases: ['rad', 'radiostation'],
  cooldown: "",
  category: "music",
  usage: "",
  description: "choose a radio",
  args: false,
  vote: false,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, prefix) => {
    const { channel } = message.member.voice;

    const container = new ContainerBuilder();
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.radio} Radio Selection`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Select a radio genre below:**\n\n` +
        `${blackEmoji.arrow} **Lofi Radio** - Chill beats\n` +
        `${blackEmoji.arrow} **Hindi Songs Radio** - Bollywood hits\n` +
        `${blackEmoji.arrow} **English Songs Radio** - Popular tracks`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('*Powered By ApeXs | 11 Genres*')
    );

    let row1 = await generate(client, "lofi_radios", "Lofi");
    let row2 = await generate(client, "hindi_radios", "Hindi");
    let row3 = await generate(client, "english_radios", "English");

    container.addActionRowComponents(row1);
    container.addActionRowComponents(row2);
    container.addActionRowComponents(row3);

    const m = await message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      })
      .catch(() => {});

    const collector = m?.createMessageComponentCollector({
      filter: (i) => {
        if (i.user.id === message.author.id) return true;
        else {
          i.reply({
            ephemeral: true,
            content: `${blackEmoji.no} Only **${message.author.tag}** can use this`,
          }).catch((err) => {
            i.deferUpdate();
          });
          return false;
        }
      },
      time: 60000,
      idle: 60000 / 2,
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
            `${blackEmoji.arrow} No radio was selected\n` +
            `${blackEmoji.arrow} Use \`${client.prefix}radio\` to try again`
          )
        );
        await m.edit({ components: [timeoutContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.deferred) interaction.deferUpdate();

      const query = radio[interaction.customId][interaction.values];

      const existing_player = await client.getPlayer(interaction.guild.id);
      if (existing_player) await existing_player.destroy();

      const loadingContainer = new ContainerBuilder();
      loadingContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Preparing Radio`)
      );
      loadingContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      loadingContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Destroying existing player...\n` +
          `${blackEmoji.arrow} Loading radio stream...`
        )
      );
      await m.edit({ components: [loadingContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

      await client.sleep(1500);
      const player = await client.manager.createPlayer({
        voiceId: channel.id,
        textId: message.channel.id,
        guildId: message.guild.id,
        shardId: message.guild.shardId,
        loadBalancer: true,
        deaf: true,
      });

      const result = await player.search(query, {
        requester: message.author,
      });

      if (!result.tracks.length) {
        const errorContainer = new ContainerBuilder();
        errorContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Radio Unavailable`)
        );
        errorContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        errorContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} This radio is currently unavailable\n` +
            `${blackEmoji.arrow} Please contact [support](${client.support}) for help`
          )
        );
        return await m.edit({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      const tracks = result.tracks;

      if (result.type === "PLAYLIST")
        for (let track of tracks) await player.queue.add(track);
      else await player.queue.add(tracks[0]);

      player.radioMode = true;

      if (!player.playing && !player.paused) player.play();

      const successContainer = new ContainerBuilder();
      successContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Radio Started`)
      );
      successContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      successContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Radio:** ${interaction.values}\n` +
          `${blackEmoji.arrow} **Started by:** ${message.author}`
        )
      );
      return await m
        .edit({ components: [successContainer], flags: MessageFlags.IsComponentsV2 })
        .catch(() => {})
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    });
  },
};
