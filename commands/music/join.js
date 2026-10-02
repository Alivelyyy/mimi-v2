const { 
  ActionRowBuilder, 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags 
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "join",
  aliases: ['summon', 'comehere'],
  cooldown: "",
  category: "music",
  usage: "",
  description: "join a voice channel",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: true,
  sameVoiceChannel: false,
  execute: async (client, message, args, prefix) => {
    const { channel } = message.member.voice;
    const player = await client.getPlayer(message.guild.id);

    if (player) {
      const container = new ContainerBuilder();
      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.mic} Already Connected`)
      );
      
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Already connected to <#${player.voiceId}>\n` +
          `${blackEmoji.arrow} Click below to move me to your channel`
        )
      );
      
      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("move")
            .setLabel("Move Me")
            .setStyle(ButtonStyle.Success)
        )
      );
      
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
        if (!interaction.deferred) interaction.deferUpdate();

        const loadingContainer = new ContainerBuilder();
        loadingContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Joining Channel`)
        );
        loadingContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        loadingContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Moving to <#${channel.id}>...`
          )
        );

        m?.edit({
          components: [loadingContainer],
          flags: MessageFlags.IsComponentsV2
        }).catch(() => {});

        let res = null;
        try {
          await message.guild.members.me.voice.setChannel(channel);
          res = 1;
        } catch (e) {
          res = e;
        }

        if (res != 1) {
          const errContainer = new ContainerBuilder();
          errContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to move: Missing \`MoveMembers\` permission`)
          );
          return await m?.edit({
            components: [errContainer],
            flags: MessageFlags.IsComponentsV2,
          });
        }

        let newPlayer = await client.getPlayer(message.guild.id);
        newPlayer.voiceId = channel.id;
        newPlayer.textId = message.channel.id;
        let data = await client.db.twoFourSeven.get(
          `${client.user.id}_${message.guild.id}`,
        );
        if (data)
          await client.db.twoFourSeven.set(
            `${client.user.id}_${message.guild.id}`,
            {
              TextId: newPlayer.textId,
              VoiceId: newPlayer.voiceId,
            },
          );

        const successContainer = new ContainerBuilder();
        successContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Successfully Moved`)
        );
        successContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        successContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} **Voice:** <#${channel.id}>\n` +
            `${blackEmoji.arrow} **Text:** <#${message.channel.id}>\n` +
            `${blackEmoji.arrow} **Moved by:** ${message.author}`
          )
        );

        await m.edit({ components: [successContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      });

      collector?.on("end", async (collected, reason) => {
        const emptyContainer = new ContainerBuilder();
        await m?.edit({ components: [emptyContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      });
      return;
    }

    const joiningContainer = new ContainerBuilder();
    joiningContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Joining Channel`)
    );
    joiningContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    joiningContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Joining <#${channel.id}>...`
      )
    );

    let msg = await message
      .reply({
        components: [joiningContainer],
        flags: MessageFlags.IsComponentsV2
      })
      .catch(() => {});

    await client.manager.createPlayer({
      voiceId: channel.id,
      textId: message.channel.id,
      guildId: message.guild.id,
      shardId: message.guild.shardId,
      loadBalancer: true,
      deaf: true,
    });

    let newPlayer = await client.getPlayer(message.guild.id);
    newPlayer.voiceId = channel.id;
    newPlayer.textId = message.channel.id;

    let data = await client.db.twoFourSeven.get(
      `${client.user.id}_${message.guild.id}`,
    );
    if (data)
      await client.db.twoFourSeven.set(
        `${client.user.id}_${message.guild.id}`,
        {
          TextId: newPlayer.textId,
          VoiceId: newPlayer.voiceId,
        },
      );

    await msg?.delete().catch(() => {});
    await message.react(blackEmoji.checkReact)
  },
};
