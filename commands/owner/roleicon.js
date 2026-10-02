const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "roleicon",
  aliases: ['ricon', 'setriconrole'],
  cooldown: "5",
  category: "config",
  description: "Add an emoji or image as a role icon",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ["ManageRoles"],
  userPerms: ["ManageRoles"],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, prefix) => {
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

    if (!role) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role or provide a valid role ID`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    if (!message.guild.features.includes('ROLE_ICONS')) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} This server does not have enough boosts to use role icons`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const repliedMessage = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;
    let iconUrl = null;

    // Check for images/attachments in replied message
    if (repliedMessage) {
      if (repliedMessage.attachments.size > 0) {
        const attachment = repliedMessage.attachments.first();
        if (attachment.contentType?.startsWith('image/')) {
          iconUrl = attachment.url;
        }
      }

      if (!iconUrl && repliedMessage.content) {
        const urlRegex = /https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp)(\?[^\s]*)?/gi;
        const match = repliedMessage.content.match(urlRegex);
        if (match) {
          iconUrl = match[0];
        }

        const emojiRegex = /<(?:a)?:[a-zA-Z0-9_]+:(\d+)>/;
        const emojiMatch = repliedMessage.content.match(emojiRegex);
        if (emojiMatch) {
          iconUrl = `https://cdn.discordapp.com/emojis/${emojiMatch[1]}.png`;
        }
      }
    }

    // Check args for emoji or URL
    if (!iconUrl && args[1]) {
      const emojiRegex = /<(?:a)?:[a-zA-Z0-9_]+:(\d+)>/;
      const emojiMatch = args[1].match(emojiRegex);
      if (emojiMatch) {
        iconUrl = `https://cdn.discordapp.com/emojis/${emojiMatch[1]}.png`;
      } else if (/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(args[1])) {
        iconUrl = args[1];
      }
    }

    if (!iconUrl) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide an emoji, image URL, or reply to a message with an image/emoji`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    try {
      await role.setIcon(iconUrl);
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.yes} Successfully updated icon for role **${role.name}**`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to update role icon: ${error.message}`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  }
};
