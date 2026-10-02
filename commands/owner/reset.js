const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

module.exports = {
  name: 'reset',
  aliases: ['resetall', 'serverreset'],
  cooldown: '',
  category: 'owner',
  usage: '<all>',
  description: 'Reset all MongoDB data for this server',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    if (message.guild.ownerId !== message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Only the **server owner** can run this command.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const arg = args[0]?.toLowerCase();
    if (arg !== 'all') {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.info} **Usage:** \`${client.prefix}reset all\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const confirm = new ContainerBuilder();
    confirm.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `# ${blackEmoji.warn} Reset Server Data\n` +
      `This will delete all MongoDB data for **${message.guild.name}**.`
    ));
    confirm.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    confirm.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('reset_server_yes').setLabel('Reset Server Data').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('reset_server_no').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
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

    if (interaction.customId === 'reset_server_no') {
      const cancelled = new ContainerBuilder();
      cancelled.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Reset cancelled.`));
      return interaction.update({ components: [cancelled], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await clearServerData(client, message.guild.id);
      const success = new ContainerBuilder();
      success.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} All MongoDB data for **${message.guild.name}** has been reset.`
      ));
      return interaction.update({ components: [success], flags: MessageFlags.IsComponentsV2 });
    } catch (error) {
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Failed to reset server data.`
      ));
      errorContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`Error: ${error.message}`));
      return interaction.update({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 });
    }
  }
};

async function clearServerData(client, guildId) {
  const databasePath = path.join(__dirname, '..', '..', 'database');
  const files = fs.readdirSync(databasePath).filter((file) => file.endsWith('.js') && file !== 'kvStore.js');

  for (const file of files) {
    require(path.join(databasePath, file));
  }

  const modelNames = mongoose.modelNames();
  for (const modelName of modelNames) {
    const Model = mongoose.model(modelName);
    if (Model.schema.path('guildId')) {
      await Model.deleteMany({ guildId });
    }
  }

  const kvStores = ['pfx', 'ignore', 'premium', 'vouchers', 'blacklist', 'twoFourSeven', 'badges', 'np', 'spotify', 'aio'];
  const guildPattern = new RegExp(`(^|_)${guildId}(_|$)`);

  for (const storeName of kvStores) {
    const store = client.db[storeName];
    if (!store) continue;
    const keys = await store.keys;
    for (const key of keys) {
      if (key === guildId || guildPattern.test(key)) {
        await store.delete(key);
      }
    }
  }
}
