const crypto = require('crypto');
const Playlist = require("@db/playlistSchema.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "plshare",
  aliases: ['plsh', 'shareplaylist'],
  category: "playlist",
  usage: "<playlist name>",
  description: "Share one of your playlists with others using a share code",
  args: true,
  premium: true,

  execute: async (client, message, args) => {
    const playlistName = args.join(" ");

    if (!playlistName) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Missing Playlist Name`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Please provide a playlist name\n` +
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}plshare <name>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      const playlist = await Playlist.findOne({
        userId: message.author.id,
        name: playlistName
      });

      if (!playlist) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Playlist Not Found`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} You don't have a playlist named \`${playlistName}\`\n` +
          `${blackEmoji.arrow} Use \`${client.prefix}pllist\` to see your playlists`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const trackCount = playlist.tracks?.length || 0;

      if (!playlist.isPublic) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.lock} Private Playlist`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
          `${blackEmoji.arrow} This playlist is private. Make it public to share?`
        ));
        c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        c.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("make_public_share").setLabel("Make Public & Share").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("cancel_share").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
          )
        );

        const confirmMsg = await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });

        const interaction = await confirmMsg.awaitMessageComponent({
          filter: (i) => i.user.id === message.author.id,
          time: 15000,
          componentType: ComponentType.Button,
        }).catch(() => null);

        if (!interaction || interaction.customId === "cancel_share") {
          const cancelC = new ContainerBuilder();
          cancelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Cancelled`));
          cancelC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
          cancelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Your playlist remains private`
          ));
          if (interaction) {
            await interaction.update({ components: [cancelC], flags: MessageFlags.IsComponentsV2 });
          } else {
            await confirmMsg.edit({ components: [cancelC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
          }
          return;
        }

        const shareCode = playlist.shareCode || crypto.randomBytes(6).toString('hex');
        await Playlist.updateOne(
          { userId: message.author.id, name: playlistName },
          { isPublic: true, shareCode }
        );

        const successC = new ContainerBuilder();
        successC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.link} Playlist Shared`));
        successC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        successC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
          `${blackEmoji.music} **Tracks:** ${trackCount}\n` +
          `${blackEmoji.user} **Owner:** ${message.author}\n` +
          `${blackEmoji.website} **Status:** Now Public`
        ));
        successC.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        successC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `**Share Code:**\n\`\`\`${shareCode}\`\`\`\n` +
          `**Play Command:**\n\`\`\`${client.prefix}plplayshared ${shareCode}\`\`\``
        ));
        await interaction.update({ components: [successC], flags: MessageFlags.IsComponentsV2 });
        return;
      }

      let shareCode = playlist.shareCode;
      if (!shareCode) {
        shareCode = crypto.randomBytes(6).toString('hex');
        await Playlist.updateOne(
          { userId: message.author.id, name: playlistName },
          { shareCode }
        );
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.link} Share Playlist`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
        `${blackEmoji.music} **Tracks:** ${trackCount}\n` +
        `${blackEmoji.user} **Owner:** ${message.author}`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**Share Code:**\n\`\`\`${shareCode}\`\`\`\n` +
        `**Play Command:**\n\`\`\`${client.prefix}plplayshared ${shareCode}\`\`\``
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.info} Use \`${client.prefix}plpubliclist\` to browse all public playlists`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error("Error in plshare:", error);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Error`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} An error occurred while sharing your playlist`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
