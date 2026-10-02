const crypto = require('crypto');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const Playlist = require("@db/playlistSchema.js");
const blackEmoji = require('@assets/emojis/black.js');
const { setPublicPlaylistsCount } = require('@utils/userData');

module.exports = {
  name: "plprivacy",
  aliases: ['plpr', 'playlistprivacy'],
  category: "playlist",
  usage: "<playlist name>",
  description: "Toggle playlist privacy between public and private",
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
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}plprivacy <name>\``
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

      const isPublic = playlist.isPublic || false;
      const trackCount = playlist.tracks?.length || 0;

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Privacy Settings`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
        `${blackEmoji.music} **Tracks:** ${trackCount}\n` +
        `${isPublic ? blackEmoji.website : blackEmoji.lock} **Current:** ${isPublic ? "Public" : "Private"}`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Public** — Others can view and play your playlist\n` +
        `${blackEmoji.arrow} **Private** — Only you can access it`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("privacy_public").setLabel("Make Public").setStyle(isPublic ? ButtonStyle.Success : ButtonStyle.Secondary).setDisabled(isPublic),
          new ButtonBuilder().setCustomId("privacy_private").setLabel("Make Private").setStyle(!isPublic ? ButtonStyle.Success : ButtonStyle.Secondary).setDisabled(!isPublic)
        )
      );

      const msg = await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });

      const interaction = await msg.awaitMessageComponent({
        filter: (i) => i.user.id === message.author.id,
        time: 30000,
        componentType: ComponentType.Button,
      }).catch(() => null);

      if (!interaction) {
        const timeoutC = new ContainerBuilder();
        timeoutC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Timed Out`));
        timeoutC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        timeoutC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Privacy selection timed out — no changes made`
        ));
        return msg.edit({ components: [timeoutC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      if (interaction.customId === "privacy_public") {
        const shareCode = playlist.shareCode || crypto.randomBytes(6).toString('hex');
        await Playlist.updateOne(
          { userId: message.author.id, name: playlistName },
          { isPublic: true, shareCode }
        );
        try {
          const publicCount = await Playlist.countDocuments({ userId: message.author.id, isPublic: true });
          setPublicPlaylistsCount(message.author.id, message.author.username, publicCount);
        } catch {}

        const updatedC = new ContainerBuilder();
        updatedC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Now Public`));
        updatedC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        updatedC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
          `${blackEmoji.website} **Status:** Public\n` +
          `${blackEmoji.link} **Share Code:** \`${shareCode}\`\n\n` +
          `${blackEmoji.arrow} Others can now play with \`${client.prefix}plplayshared ${shareCode}\``
        ));
        await interaction.update({ components: [updatedC], flags: MessageFlags.IsComponentsV2 });
      } else {
        await Playlist.updateOne(
          { userId: message.author.id, name: playlistName },
          { isPublic: false }
        );
        try {
          const publicCount = await Playlist.countDocuments({ userId: message.author.id, isPublic: true });
          setPublicPlaylistsCount(message.author.id, message.author.username, publicCount);
        } catch {}

        const updatedC = new ContainerBuilder();
        updatedC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Now Private`));
        updatedC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        updatedC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.playlist} **Playlist:** \`${playlistName}\`\n` +
          `${blackEmoji.lock} **Status:** Private\n\n` +
          `${blackEmoji.arrow} Only you can access this playlist now`
        ));
        await interaction.update({ components: [updatedC], flags: MessageFlags.IsComponentsV2 });
      }
    } catch (error) {
      console.error("Error in plprivacy:", error);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Error`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} An error occurred while updating playlist privacy`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
