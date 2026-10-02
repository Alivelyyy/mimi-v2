const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const mongoose = require('mongoose');

module.exports = {
  name: 'resetdbfullokmongo',
  aliases: [],
  cooldown: '',
  category: 'owner',
  usage: '',
  description: 'Reset the entire MongoDB database for the bot',
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: true,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message) => {
    const confirm = new ContainerBuilder();
    confirm.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `# ${blackEmoji.warn} Reset MongoDB Database\n` +
      `This will **delete all data** stored in MongoDB for this bot.\n` +
      `${blackEmoji.info} This action cannot be undone.`
    ));
    confirm.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    confirm.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('resetdb_full_yes').setLabel('Reset Database').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('resetdb_full_no').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
      )
    );

    const prompt = await message.reply({ components: [confirm], flags: MessageFlags.IsComponentsV2 });

    let interaction;
    try {
      interaction = await prompt.awaitMessageComponent({
        filter: (i) => i.user.id === message.author.id,
        componentType: ComponentType.Button,
        time: 20000
      });
    } catch {
      const timeoutContainer = new ContainerBuilder();
      timeoutContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Reset timed out.`));
      return prompt.edit({ components: [timeoutContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    if (interaction.customId === 'resetdb_full_no') {
      const cancelled = new ContainerBuilder();
      cancelled.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Reset cancelled.`));
      return interaction.update({ components: [cancelled], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await mongoose.connection.dropDatabase();
      const success = new ContainerBuilder();
      success.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} MongoDB database has been reset successfully.\n` +
        `${blackEmoji.info} The bot will continue running, but all stored data is now removed.`
      ));
      return interaction.update({ components: [success], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Failed to reset the database.`
      ));
      errorContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`Error: ${error.message}`));
      return interaction.update({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
