const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  MessageFlags,
  PermissionsBitField
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "move",
  aliases: ['mv', 'moveto'],
  category: "music",
  description: "Move the bot to your current voice channel (Admin/Owner only)",
  args: false,
  execute: async (client, message, args) => {
    const player = await client.getPlayer(message.guild.id);
    
    if (!player) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} **No active player found in this server.**`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    // Check permissions: Admin or Owner
    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const isOwner = message.guild.ownerId === message.author.id;
    const isBotOwner = client.config.ownerIds?.includes(message.author.id);

    if (!isAdmin && !isOwner && !isBotOwner) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} **Only server admins or the owner can use this command.**`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.warn} **You must be in a voice channel to move the bot.**`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (player.voiceId === voiceChannel.id) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.warn} **I am already in your voice channel.**`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await player.setVoiceChannel(voiceChannel.id);
      
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.yes} **Moved to ${voiceChannel.name}!**`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      console.error("Error moving player:", error);
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} **Failed to move: ${error.message}**`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
