const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "steal",
  aliases: ['grab', 'stealemoji'],
  cooldown: "5",
  category: "utility",
  description: "Steal emojis, stickers, or images from URLs and add them to the server",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ["ManageEmojisAndStickers", "ManageGuildExpressions"],
  userPerms: ["ManageEmojisAndStickers", "ManageGuildExpressions"],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, prefix) => {
    const repliedMessage = message.reference ? await message.channel.messages.fetch(message.reference.messageId) : null;

    // Check for images/attachments in replied message
    if (repliedMessage) {
      let imageUrl = null;
      let imageName = 'image';

      // Check attachments
      if (repliedMessage.attachments.size > 0) {
        const attachment = repliedMessage.attachments.first();
        if (attachment.contentType?.startsWith('image/')) {
          imageUrl = attachment.url;
          imageName = attachment.name;
        }
      }

      // Check for image URLs in message content
      if (!imageUrl && repliedMessage.content) {
        const urlRegex = /https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp)(\?[^\s]*)?/gi;
        const match = repliedMessage.content.match(urlRegex);
        if (match) {
          imageUrl = match[0];
          imageName = 'url_image';
        }
      }

      if (imageUrl) {
        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`#  Steal Image from Reply`)
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Image Source:** Replied message\n` +
            `**Suggested Name:** ${imageName}`
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`steal_reply_emoji_${message.author.id}_${Date.now()}`)
              .setLabel('Steal as Emoji')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`steal_reply_sticker_${message.author.id}_${Date.now()}`)
              .setLabel('Steal as Sticker')
              .setStyle(ButtonStyle.Secondary)
          )
        );

        const msg = await message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });

        // Collector for buttons
        const collector = msg.createMessageComponentCollector({
          filter: (i) => (i.customId.startsWith('steal_reply_emoji_') || i.customId.startsWith('steal_reply_sticker_')) && i.customId.includes(message.author.id),
          time: 30000
        });

        collector.on('collect', async (interaction) => {
          await interaction.deferUpdate();
          const isEmoji = interaction.customId.startsWith('steal_reply_emoji');

          try {
            if (isEmoji) {
              // Steal as emoji
              let emojiName = `mimi_${imageName.replace(/[^a-zA-Z0-9_]/g, '')}`;
              if (emojiName.length < 2) emojiName = `mimi_${Date.now().toString().slice(-10)}`;
              if (emojiName.length > 32) emojiName = emojiName.slice(0, 32);

              const newEmoji = await message.guild.emojis.create({
                attachment: imageUrl,
                name: emojiName
              });

              const successContainer = new ContainerBuilder();
              successContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${blackEmoji.yes} Successfully added emoji ${newEmoji} with name \`${newEmoji.name}\`!`)
              );

              await msg.edit({
                components: [successContainer],
                flags: MessageFlags.IsComponentsV2,
              });
            } else {
              // Steal as sticker
              let stickerName = `mimi ${imageName.replace(/[^a-zA-Z0-9_ ]/g, '')}`;
              if (stickerName.length < 2) stickerName = `mimi ${Date.now().toString().slice(-10)}`;
              if (stickerName.length > 30) stickerName = stickerName.slice(0, 30);

              const newSticker = await message.guild.stickers.create({
                file: imageUrl,
                name: stickerName,
                tags: 'stolen',
                description: `Stolen from replied message by ${message.author.tag}`
              });

              const successContainer = new ContainerBuilder();
              successContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${blackEmoji.yes} Successfully added sticker ${newSticker.name}!`)
              );

              await msg.edit({
                components: [successContainer],
                flags: MessageFlags.IsComponentsV2,
              });
            }
          } catch (error) {
            const errorContainer = new ContainerBuilder();
            errorContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to add ${isEmoji ? 'emoji' : 'sticker'}: ${error.message}`)
            );

            await msg.edit({
              components: [errorContainer],
              flags: MessageFlags.IsComponentsV2,
            });
          }
        });

        collector.on('end', () => {
          // Optional
        });

        return;
      }
    }

    // Check for stickers in replied message
    if (repliedMessage && repliedMessage.stickers.size > 0) {
      const sticker = repliedMessage.stickers.first();
      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# <:sticker:1415701183569596589> Steal Sticker: ${sticker.name}`)
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Sticker Info:**\n` +
          `**Name:** ${sticker.name}\n` +
          `**ID:** ${sticker.id}\n` +
          `**Type:** ${sticker.format === 1 ? 'PNG' : sticker.format === 2 ? 'APNG' : 'Lottie'}\n` +
          `**Description:** ${sticker.description}`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`steal_sticker_${sticker.id}_${message.author.id}`)
            .setLabel('Steal Sticker')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`clone_emoji_${sticker.id}_${message.author.id}`)
            .setLabel('Clone as Emoji')
            .setStyle(ButtonStyle.Secondary)
        )
      );

      const msg = await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });

      // Collector for buttons
      const collector = msg.createMessageComponentCollector({
        filter: (i) => (i.customId === `steal_sticker_${sticker.id}_${message.author.id}` || i.customId === `clone_emoji_${sticker.id}_${message.author.id}`) && i.user.id === message.author.id,
        time: 30000
      });

      collector.on('collect', async (interaction) => {
        await interaction.deferUpdate();
        const isCloneEmoji = interaction.customId.startsWith('clone_emoji');

        try {
          if (isCloneEmoji) {
            // Clone sticker as emoji
            let emojiName = `mimi_${sticker.name.replace(/[^a-zA-Z0-9_]/g, '')}`;
            if (emojiName.length < 2) emojiName = `mimi_${sticker.id.slice(-10)}`;
            if (emojiName.length > 32) emojiName = emojiName.slice(0, 32);

            const newEmoji = await message.guild.emojis.create({
              attachment: sticker.url,
              name: emojiName
            });

            const successContainer = new ContainerBuilder();
            successContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.yes} Successfully cloned sticker as emoji ${newEmoji} with name \`${newEmoji.name}\`!`)
            );

            await msg.edit({
              components: [successContainer],
              flags: MessageFlags.IsComponentsV2,
            });
          } else {
            // Steal as sticker
            let stickerName = `mimi ${sticker.name.replace(/[^a-zA-Z0-9_ ]/g, '')}`;
            if (stickerName.length < 2) stickerName = `mimi ${sticker.id.slice(-10)}`;
            if (stickerName.length > 30) stickerName = stickerName.slice(0, 30);

            const newSticker = await message.guild.stickers.create({
              file: sticker.url,
              name: stickerName,
              tags: sticker.tags,
              description: sticker.description || `Stolen from ${repliedMessage.author.tag}`
            });

            const successContainer = new ContainerBuilder();
            successContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.yes} Successfully added sticker ${newSticker.name}!`)
            );

            await msg.edit({
              components: [successContainer],
              flags: MessageFlags.IsComponentsV2,
            });
          }
        } catch (error) {
          const errorContainer = new ContainerBuilder();
          errorContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to add ${isCloneEmoji ? 'emoji' : 'sticker'}: ${error.message}`)
          );

          await msg.edit({
            components: [errorContainer],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      });

      collector.on('end', () => {
        // Optional: disable button or leave as is
      });

      return;
    }

    // Check for emojis in replied message text
    if (repliedMessage && repliedMessage.content) {
      const emojiRegex = /<(?:a)?:([a-zA-Z0-9_]+):(\d+)>/g;
      const foundEmojis = [...repliedMessage.content.matchAll(emojiRegex)];

      if (foundEmojis.length > 0) {
        const firstEmoji = foundEmojis[0];
        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# <:emoji:1415701183569596589> Steal Emoji: ${firstEmoji[1]}`)
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Emoji Info:**\n` +
            `**Name:** ${firstEmoji[1]}\n` +
            `**ID:** ${firstEmoji[2]}\n` +
            `**Animated:** ${firstEmoji[0].startsWith('<a') ? 'Yes' : 'No'}`
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`steal_emoji_${firstEmoji[2]}_${message.author.id}`)
              .setLabel('Steal Emoji')
              .setStyle(ButtonStyle.Primary)
          )
        );

        const msg = await message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });

        // Collector for button
        const collector = msg.createMessageComponentCollector({
          filter: (i) => i.customId === `steal_emoji_${firstEmoji[2]}_${message.author.id}` && i.user.id === message.author.id,
          time: 30000
        });

        collector.on('collect', async (interaction) => {
          await interaction.deferUpdate();

          try {
            const extension = firstEmoji[0].startsWith('<a') ? 'gif' : 'png';
            const url = `https://cdn.discordapp.com/emojis/${firstEmoji[2]}.${extension}`;

            let emojiName = `mimi_${firstEmoji[1].replace(/[^a-zA-Z0-9_]/g, '')}`;
            if (emojiName.length < 2) emojiName = `mimi_${firstEmoji[2].slice(-10)}`;
            if (emojiName.length > 32) emojiName = emojiName.slice(0, 32);

            const newEmoji = await message.guild.emojis.create({
              attachment: url,
              name: emojiName
            });

            const successContainer = new ContainerBuilder();
            successContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.yes} Successfully added ${newEmoji} with name \`${newEmoji.name}\`!`)
            );

            await msg.edit({
              components: [successContainer],
              flags: MessageFlags.IsComponentsV2,
            });
          } catch (error) {
            const errorContainer = new ContainerBuilder();
            errorContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to add emoji: ${error.message}`)
            );

            await msg.edit({
              components: [errorContainer],
              flags: MessageFlags.IsComponentsV2,
            });
          }
        });

        collector.on('end', () => {
          // Optional
        });

        return;
      }
    }

    // Fallback to original emoji stealing by argument or image URL
    const input = args[0];
    const name = args[1];

    if (!input) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide an emoji ID, image URL, or reply to a message with emoji/sticker`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    // Check if it's an image/GIF URL
    const isImageUrl = /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(input);

    if (isImageUrl) {
      // Handle image URL stealing
      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# <:image:1415701183569596589> Steal Image: ${name}`)
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Image URL:** ${input}\n` +
          `**Suggested Name:** ${name}`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`steal_image_emoji_${message.author.id}_${Date.now()}`)
            .setLabel('Steal as Emoji')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`steal_image_sticker_${message.author.id}_${Date.now()}`)
            .setLabel('Steal as Sticker')
            .setStyle(ButtonStyle.Secondary)
        )
      );

      const msg = await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });

      // Collector for buttons
      const collector = msg.createMessageComponentCollector({
        filter: (i) => (i.customId.startsWith('steal_image_emoji_') || i.customId.startsWith('steal_image_sticker_')) && i.customId.includes(message.author.id),
        time: 30000
      });

      collector.on('collect', async (interaction) => {
        await interaction.deferUpdate();
        const isEmoji = interaction.customId.startsWith('steal_image_emoji');

        try {
          if (isEmoji) {
            // Steal as emoji
            let emojiName = `mimi_${name.replace(/[^a-zA-Z0-9_]/g, '')}`;
            if (emojiName.length < 2) emojiName = `mimi_${Date.now().toString().slice(-10)}`;
            if (emojiName.length > 32) emojiName = emojiName.slice(0, 32);

            const newEmoji = await message.guild.emojis.create({
              attachment: input,
              name: emojiName
            });

            const successContainer = new ContainerBuilder();
            successContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.yes} Successfully added emoji ${newEmoji} with name \`${newEmoji.name}\`!`)
            );

            await msg.edit({
              components: [successContainer],
              flags: MessageFlags.IsComponentsV2,
            });
          } else {
            // Steal as sticker
            let stickerName = `mimi ${name.replace(/[^a-zA-Z0-9_ ]/g, '')}`;
            if (stickerName.length < 2) stickerName = `mimi ${Date.now().toString().slice(-10)}`;
            if (stickerName.length > 30) stickerName = stickerName.slice(0, 30);

            const newSticker = await message.guild.stickers.create({
              file: input,
              name: stickerName,
              tags: 'stolen',
              description: `Stolen from URL by ${message.author.tag}`
            });

            const successContainer = new ContainerBuilder();
            successContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.yes} Successfully added sticker ${newSticker.name}!`)
            );

            await msg.edit({
              components: [successContainer],
              flags: MessageFlags.IsComponentsV2,
            });
          }
        } catch (error) {
          const errorContainer = new ContainerBuilder();
          errorContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to add ${isEmoji ? 'emoji' : 'sticker'}: ${error.message}`)
          );

          await msg.edit({
            components: [errorContainer],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      });

      collector.on('end', () => {
        // Optional
      });

      return;
    }

    // Handle emoji by ID
    let parsedEmoji;
    if (input.startsWith('<') && input.endsWith('>')) {
      const matched = input.match(/<(?:a)?:([a-zA-Z0-9_]+):(\d+)>/);
      if (!matched) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.no} Invalid emoji format`)
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      parsedEmoji = {
        animated: input.startsWith('<a'),
        name: matched[1],
        id: matched[2]
      };
    } else {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide a valid emoji ID or image URL`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const extension = parsedEmoji.animated ? 'gif' : 'png';
    const url = `https://cdn.discordapp.com/emojis/${parsedEmoji.id}.${extension}`;

    try {
      let emojiName = `mimi_${parsedEmoji.name.replace(/[^a-zA-Z0-9_]/g, '')}`;
      if (emojiName.length < 2) emojiName = `mimi_${parsedEmoji.id.slice(-10)}`;
      if (emojiName.length > 32) emojiName = emojiName.slice(0, 32);

      const newEmoji = await message.guild.emojis.create({
        attachment: url,
        name: emojiName
      });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.yes} Successfully added ${newEmoji} with name \`${newEmoji.name}\``)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to add emoji: ${error.message}`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  }
};
