const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const Playlist = require("@db/playlistSchema.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "plcreate",
  aliases: ['plc', 'newplaylist'],
  category: "playlist",
  usage: "<playlist name>",
  description: "Create a new empty playlist that you can add songs to later",
  args: true,
  premium: true,

  execute: async (client, message, args) => {
    const playlistName = args.join(" ");

    if (!playlistName) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Missing Playlist Name`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Please provide a name for your playlist\n` +
        `${blackEmoji.arrow} **Usage:** \`${client.prefix}plcreate <name>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (playlistName.length > 32) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Name Too Long`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Playlist name cannot exceed **32** characters\n` +
        `${blackEmoji.arrow} Current length: **${playlistName.length}** characters`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      const userPlaylists = await Playlist.find({ userId: message.author.id });

      if (userPlaylists.length >= 25) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Playlist Limit Reached`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} You can have a maximum of **25** playlists\n` +
          `${blackEmoji.arrow} Delete one with \`${client.prefix}pldelete <name>\` first`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const existing = userPlaylists.find(p => p.name === playlistName);
      if (existing) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Playlist Exists`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} You already have a playlist named \`${playlistName}\`\n` +
          `${blackEmoji.arrow} Use \`${client.prefix}plview ${playlistName}\` to view it`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const newPlaylist = new Playlist({
        userId: message.author.id,
        name: playlistName,
        tracks: [],
        isPublic: false,
        createdAt: new Date()
      });
      await newPlaylist.save();

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Playlist Created`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.playlist} **Name:** \`${playlistName}\`\n` +
        `${blackEmoji.user} **Owner:** ${message.author}\n` +
        `${blackEmoji.lock} **Privacy:** Private\n` +
        `${blackEmoji.list} **Total Playlists:** ${userPlaylists.length + 1}/25`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Add tracks: \`${client.prefix}pladd ${playlistName} <song>\`\n` +
        `${blackEmoji.arrow} Add queue: \`${client.prefix}pladdqueue ${playlistName}\`\n` +
        `${blackEmoji.arrow} Make public: \`${client.prefix}plprivacy ${playlistName}\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error("Error in plcreate:", error);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Error`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} An error occurred while creating your playlist\n` +
        `${blackEmoji.arrow} Please try again later`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
