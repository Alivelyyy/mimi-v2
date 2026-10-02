const Playlist = require("@db/playlistSchema.js");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "pldelete",
  aliases: ['pld', 'deleteplaylist'],
  category: "playlist",
  usage: "<playlist name>",
  description: "Delete one of your playlists permanently",
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
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}pldelete <name>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

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

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Confirm Deletion`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
      `${blackEmoji.music} **Tracks:** ${trackCount}\n` +
      `${playlist.isPublic ? `${blackEmoji.website} **Privacy:** Public` : `${blackEmoji.lock} **Privacy:** Private`}\n\n` +
      `${blackEmoji.danger} **This action cannot be undone!**`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("confirm_pldelete").setLabel("Delete Playlist").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("cancel_pldelete").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
      )
    );

    const confirmMsg = await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });

    try {
      const interaction = await confirmMsg.awaitMessageComponent({
        filter: (i) => i.user.id === message.author.id,
        time: 30000,
        componentType: ComponentType.Button,
      });

      if (interaction.customId === "confirm_pldelete") {
        await Playlist.deleteOne({ userId: message.author.id, name: playlistName });

        const successC = new ContainerBuilder();
        successC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Playlist Deleted`));
        successC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        successC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Deleted \`${playlistName}\` with **${trackCount}** track(s)`
        ));
        await interaction.update({ components: [successC], flags: MessageFlags.IsComponentsV2 });
      } else {
        const cancelC = new ContainerBuilder();
        cancelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Cancelled`));
        cancelC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        cancelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Your playlist \`${playlistName}\` was not deleted`
        ));
        await interaction.update({ components: [cancelC], flags: MessageFlags.IsComponentsV2 });
      }
    } catch {
      const timeoutC = new ContainerBuilder();
      timeoutC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Timed Out`));
      timeoutC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      timeoutC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Confirmation timed out — playlist was not deleted`
      ));
      await confirmMsg.edit({ components: [timeoutC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  },
};
