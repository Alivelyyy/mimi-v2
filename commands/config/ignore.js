const { ActionRowBuilder, StringSelectMenuBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const gen = require("@gen/ignore.js");
const blackEmoji = require('@assets/emojis/black.js');
const emoji = require('@assets/emoji.js');

module.exports = {
  name: "ignore",
  aliases: ['ign', 'ignorechannel'],
  cooldown: "",
  category: "config",
  usage: "<add/del> <channel>",
  description: "Choose your ignored channels",
  args: false,
  vote: true,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    let ignoredList = await client.db.ignore.get(`${client.user.id}_${message.guild.id}`) || [];

    if (message.reference?.messageId) {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
      if (repliedMessage) {
        const channelMention = repliedMessage.content.match(/<#(\d+)>/);

        if (channelMention) {
          const channel = message.guild.channels.cache.get(channelMention[1]);
          if (!channel) {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.cross} **Invalid channel mentioned in replied message**`)
            );
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
          }

          if (ignoredList.includes(channel.id)) {
            let index = ignoredList.indexOf(channel.id);
            index !== -1 ? ignoredList.splice(index, 1) : null;
            await client.db.ignore.set(`${client.user.id}_${message.guild.id}`, ignoredList);

            const genResult = await gen(client, message, emoji, ignoredList).catch(() => null);
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.yes} **Removed <#${channel.id}> from list of ignored channels**`)
            );
            if (genResult) {
              container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
              );
              container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(genResult.text)
              );
            }
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
          } else {
            ignoredList.push(channel.id);
            await client.db.ignore.set(`${client.user.id}_${message.guild.id}`, ignoredList);

            const genResult = await gen(client, message, emoji, ignoredList).catch(() => null);
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.yes} **Added <#${channel.id}> to list of ignored channels**`)
            );
            if (genResult) {
              container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
              );
              container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(genResult.text)
              );
            }
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
          }
        }
      }
    }

    if (args[0]) {
      if (args[0].toLowerCase() === 'list') {
        const genResult = await gen(client, message, emoji, ignoredList).catch(() => null);
        if (genResult) {
          return message.reply({ components: [genResult.container], flags: MessageFlags.IsComponentsV2 });
        } else {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${blackEmoji.bell} **No ignored channels configured**`)
          );
          return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }
      }

      let channel = message.channel;
      if (args[1]) {
        let id = args[1].match(/<#(\d+)>|(\d+)/);
        id = id ? id.find(group => group !== undefined) : null;
        channel = message.guild.channels.cache.get(id) || null;
      }

      if (!channel && ['add', 'del'].includes(args[0].toLowerCase())) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.cross} **Invalid channel provided**`)
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }

      switch (args[0].toLowerCase()) {
        case 'add':
          if (ignoredList.includes(channel.id)) {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.no} **<#${channel.id}> is already present in list of ignored channels**`)
            );
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
          }

          ignoredList.push(channel.id);
          await client.db.ignore.set(`${client.user.id}_${message.guild.id}`, ignoredList);

          const addGenResult = await gen(client, message, emoji, ignoredList).catch(() => null);
          const addContainer = new ContainerBuilder();
          addContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${blackEmoji.yes} **Added <#${channel.id}> to list of ignored channels**`)
          );
          if (addGenResult) {
            addContainer.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            addContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(addGenResult.text)
            );
          }
          return message.reply({ components: [addContainer], flags: MessageFlags.IsComponentsV2 });

        case 'del':
          if (!ignoredList.includes(channel.id)) {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${blackEmoji.no} **<#${channel.id}> is not present in list of ignored channels**`)
            );
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
          }

          let index = ignoredList.indexOf(channel.id);
          index !== -1 ? ignoredList.splice(index, 1) : null;
          await client.db.ignore.set(`${client.user.id}_${message.guild.id}`, ignoredList);

          const delGenResult = await gen(client, message, emoji, ignoredList).catch(() => null);
          const delContainer = new ContainerBuilder();
          delContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${blackEmoji.yes} **Removed <#${channel.id}> from list of ignored channels**`)
          );
          if (delGenResult) {
            delContainer.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            delContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(delGenResult.text)
            );
          }
          return message.reply({ components: [delContainer], flags: MessageFlags.IsComponentsV2 });

        default:
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${blackEmoji.cross} **Provide a valid sub cmd (add/del)**`)
          );
          return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }

    await message.guild.channels.fetch().catch(() => {});
    const channels = message.guild.channels.cache.filter(ch => 
      ch.type === 0 && 
      ch !== message.guild.rulesChannel &&
      ch.permissionsFor(message.guild.members.me)?.has(["ViewChannel", "SendMessages", "EmbedLinks"])
    );

    if (channels.size === 0) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.cross} **No valid channels found to configure**`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const channelOptions = channels.map(ch => {
      const isIgnored = ignoredList.includes(ch.id);
      return {
        label: `${isIgnored ? 'Remove' : 'Add'} ${ch.name}`,
        value: `${isIgnored ? 'del' : 'add'}_${ch.id}`,
        description: `Channel ID: ${ch.id}`,
        emoji: isIgnored ? blackEmoji.off : blackEmoji.on
      };
    }).slice(0, 25);

    const genResult = await gen(client, message, emoji, ignoredList, true).catch(() => null);

    const container = genResult?.container || new ContainerBuilder();

    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select')
        .setPlaceholder('Select channels to add/remove from ignore list')
        .setMinValues(1)
        .setMaxValues(Math.min(channelOptions.length, 25))
        .addOptions(channelOptions)
    );

    container.addActionRowComponents(selectRow);

    const m = await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    if (!m) return;

    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) return true;
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.cross} Only **${message.author.tag}** can use this`)
      );
      await interaction.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      }).catch(() => {});
      return false;
    };

    const collector = m?.createMessageComponentCollector({
      filter: filter,
      time: 60000,
      idle: 30000
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate().catch(() => {});

      for (let value of interaction.values) {
        let [action, id] = value.split('_');

        if (action === 'add' && !ignoredList.includes(id)) {
          ignoredList.push(id);
        } else if (action === 'del' && ignoredList.includes(id)) {
          let index = ignoredList.indexOf(id);
          index !== -1 ? ignoredList.splice(index, 1) : null;
        }
      }

      await client.db.ignore.set(`${client.user.id}_${message.guild.id}`, ignoredList);

      const updatedOptions = channels.map(ch => {
        const isIgnored = ignoredList.includes(ch.id);
        return {
          label: `${isIgnored ? 'Remove' : 'Add'} ${ch.name}`,
          value: `${isIgnored ? 'del' : 'add'}_${ch.id}`,
          description: `Channel ID: ${ch.id}`,
          emoji: isIgnored ? blackEmoji.off : blackEmoji.on
        };
      }).slice(0, 25);

      const updatedGenResult = await gen(client, message, emoji, ignoredList, true).catch(() => null);

      const updatedContainer = updatedGenResult?.container || new ContainerBuilder();

      const updatedSelectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select')
          .setPlaceholder('Select channels to add/remove from ignore list')
          .setMinValues(1)
          .setMaxValues(Math.min(updatedOptions.length, 25))
          .addOptions(updatedOptions)
      );

      updatedContainer.addActionRowComponents(updatedSelectRow);

      await m.edit({
        components: [updatedContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    });

    collector?.on("end", async () => {
      const finalGenResult = await gen(client, message, emoji, ignoredList).catch(() => null);

      await m.edit({ 
        components: finalGenResult?.container ? [finalGenResult.container] : [],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    });
  }
};