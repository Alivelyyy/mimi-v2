const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");
const CustomEmbed = require("@db/customEmbed.js");
const { J2CChannel } = require("@db/join2create.js");
const { buildJ2CPanel } = require("@utils/j2cPanel.js");
const { handleTicketInteraction } = require("@utils/ticketHandler.js");

module.exports = {
  name: "interactionCreate",
  run: async (client, interaction) => {
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('embed_modal:')) {
        return handleEmbedModal(client, interaction);
      }
      if (interaction.customId.startsWith('j2c_modal:')) {
        return handleJ2CModal(client, interaction);
      }
      if (interaction.customId.startsWith('ticket_reason')) {
        return handleTicketInteraction(client, interaction);
      }
      return;
    }
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_category_select') {
        return handleTicketInteraction(client, interaction);
      }
    }
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('ticket_') && !interaction.customId.startsWith('ticket_reset_')) {
        return handleTicketInteraction(client, interaction);
      }
      let playerButtonIds = [
        `${interaction.guildId}play_pause`,
        `${interaction.guildId}previous`,
        `${interaction.guildId}skip`,
        `${interaction.guildId}stop`,
        `${interaction.guildId}autoplay`,
        `${interaction.guildId}loop`,
        `${interaction.guildId}shuffle`,
        `${interaction.guildId}seek`,
        `${interaction.guildId}leave`,
        `${interaction.guildId}like`,
        `${interaction.guildId}vol_up`,
        `${interaction.guildId}vol_down`,
        `${interaction.guildId}replay`,
        `pause`, // Fallback for old buttons
        `skip`,  // Fallback for old buttons
        `stop`,  // Fallback for old buttons
        `loop`,  // Fallback for old buttons
        `shuffle` // Fallback for old buttons
      ];
      if (playerButtonIds.includes(interaction.customId))
        return client.emit("playerButtonClick", interaction);

      if (interaction.customId.startsWith('embed_edit:')) {
        return handleEmbedButton(client, interaction);
      }

      // Manage command button handlers
      if (interaction.customId.startsWith("manage:")) {
        const [_, action, userId] = interaction.customId.split(":");

        let targetUser;
        try {
          targetUser = await client.users.fetch(userId);
        } catch (e) {
          return interaction.reply({
            content: "User not found",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (action === "premium") {
          const current = await client.db.premium.get(`${client.user.id}_${userId}`);
          
          if (current) {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${blackEmoji.diamond} Premium Settings`)
            );
            container.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${targetUser.tag} already has premium. Choose an action:`)
            );
            
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`prem:remove:${userId}`)
                .setLabel("Remove Premium")
                .setStyle(ButtonStyle.Danger)
                .setEmoji(blackEmoji.no),
              new ButtonBuilder()
                .setCustomId(`prem:extend:30:${userId}`)
                .setLabel("Extend (30 days)")
                .setStyle(ButtonStyle.Primary)
                .setEmoji(blackEmoji.yes)
            );
            
            return interaction.reply({
              components: [container, row],
              flags: MessageFlags.IsComponentsV2,
            });
          } else {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${blackEmoji.diamond} Grant Premium`)
            );
            container.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`Choose premium duration for ${targetUser.tag}:`)
            );
            
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`prem:grant:30:${userId}`)
                .setLabel("30 Days")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`prem:grant:60:${userId}`)
                .setLabel("60 Days")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`prem:grant:lifetime:${userId}`)
                .setLabel("Lifetime")
                .setStyle(ButtonStyle.Success)
            );
            
            return interaction.reply({
              components: [container, row],
              flags: MessageFlags.IsComponentsV2,
            });
          }
        } else if (action === "noprefix") {
          const current = await client.db.np.get(userId);
          
          if (current) {
            await client.db.np.delete(userId);
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} NoPrefix Removed`)
            );
            container.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${targetUser.tag} removed from no-prefix list`)
            );
            return interaction.reply({
              components: [container],
              flags: MessageFlags.IsComponentsV2,
            });
          } else {
            await client.db.np.set(userId, true);
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} NoPrefix Added`)
            );
            container.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${targetUser.tag} added to no-prefix list`)
            );
            return interaction.reply({
              components: [container],
              flags: MessageFlags.IsComponentsV2,
            });
          }
        } else if (action === "blacklist") {
          const current = await client.db.blacklist.get(`${client.user.id}_${userId}`);
          
          if (current) {
            await client.db.blacklist.delete(`${client.user.id}_${userId}`);
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Blacklist Removed`)
            );
            container.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${targetUser.tag} removed from blacklist`)
            );
            return interaction.reply({
              components: [container],
              flags: MessageFlags.IsComponentsV2,
            });
          } else {
            await client.db.blacklist.set(`${client.user.id}_${userId}`, true);
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Blacklist Added`)
            );
            container.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`${targetUser.tag} added to blacklist`)
            );
            return interaction.reply({
              components: [container],
              flags: MessageFlags.IsComponentsV2,
            });
          }
        }
      }

      // Premium grant/remove/extend handlers
      if (interaction.customId.startsWith("prem:")) {
        const parts = interaction.customId.split(":");
        const action = parts[1];
        const durationOrUserId = parts[2];
        const userId = parts[3] || parts[2];
        let duration = durationOrUserId;

        let targetUser = await client.users.fetch(userId).catch(() => null);
        if (!targetUser) {
          return interaction.reply({
            content: "User not found",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (action === "remove") {
          await client.db.premium.delete(`${client.user.id}_${userId}`);
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Premium Removed`)
          );
          container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${targetUser.tag} no longer has premium`)
          );
          return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          });
        } else if (action === "extend" || action === "grant") {
          let days = 30;
          if (duration === "lifetime") {
            await client.db.premium.set(`${client.user.id}_${userId}`, true);
          } else {
            days = parseInt(duration) || 30;
            const expireTime = Date.now() + (days * 24 * 60 * 60 * 1000);
            await client.db.premium.set(`${client.user.id}_${userId}`, expireTime);
          }
          
          await client.db.np.set(userId, true);
          
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.diamond} Premium Granted`)
          );
          container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.yes} ${targetUser.tag} ${duration === "lifetime" ? "lifetime premium" : `premium for ${days} days`}\n` +
              `${blackEmoji.yes} Automatically added to no-prefix list`
            )
          );
          return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          });
        }
      }

      if (interaction.customId.startsWith('j2c:')) {
        return handleJ2CButton(client, interaction);
      }

      return;
    }

  },
};

async function handleJ2CButton(client, interaction) {
  const action = interaction.customId.replace('j2c:', '');
  const member = interaction.member;
  const guild = interaction.guild;

  if (!member.voice.channel) {
    return interaction.reply({
      content: `${blackEmoji.no} You must be in a voice channel to use this.`,
      flags: MessageFlags.Ephemeral
    });
  }

  const vcDoc = await J2CChannel.findOne({ channelId: member.voice.channelId });
  if (!vcDoc) {
    return interaction.reply({
      content: `${blackEmoji.no} This is not a Join-to-Create channel.`,
      flags: MessageFlags.Ephemeral
    });
  }

  const isOwner = vcDoc.ownerId === member.id;
  const channel = member.voice.channel;

  if (action === 'claim') {
    if (isOwner) {
      return interaction.reply({ content: `${blackEmoji.no} You already own this channel.`, flags: MessageFlags.Ephemeral });
    }
    if (channel.members.has(vcDoc.ownerId)) {
      return interaction.reply({ content: `${blackEmoji.no} The owner is still in the channel.`, flags: MessageFlags.Ephemeral });
    }

    await channel.permissionOverwrites.edit(member.user, {
      ManageChannels: true, MoveMembers: true, Connect: true, Speak: true
    });
    await channel.permissionOverwrites.delete(vcDoc.ownerId).catch(() => {});
    await J2CChannel.updateOne({ _id: vcDoc._id }, { ownerId: member.id });

    const updatedDoc = await J2CChannel.findOne({ channelId: channel.id });
    await updatePanel(channel, member, updatedDoc);

    return interaction.reply({ content: `${blackEmoji.yes} You are now the owner of **${channel.name}**.`, flags: MessageFlags.Ephemeral });
  }

  if (!isOwner) {
    return interaction.reply({ content: `${blackEmoji.no} Only the channel owner can use this button.`, flags: MessageFlags.Ephemeral });
  }

  switch (action) {
    case 'lock': {
      if (vcDoc.locked) {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { Connect: null });
        await J2CChannel.updateOne({ _id: vcDoc._id }, { locked: false });
        const updatedDoc = await J2CChannel.findOne({ channelId: channel.id });
        await updatePanel(channel, member, updatedDoc);
        return interaction.reply({ content: `${blackEmoji.yes} Channel **unlocked**.`, flags: MessageFlags.Ephemeral });
      } else {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { Connect: false });
        await J2CChannel.updateOne({ _id: vcDoc._id }, { locked: true });
        const updatedDoc = await J2CChannel.findOne({ channelId: channel.id });
        await updatePanel(channel, member, updatedDoc);
        return interaction.reply({ content: `${blackEmoji.yes} Channel **locked**.`, flags: MessageFlags.Ephemeral });
      }
    }
    case 'hide': {
      if (vcDoc.hidden) {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: null });
        await J2CChannel.updateOne({ _id: vcDoc._id }, { hidden: false });
        const updatedDoc = await J2CChannel.findOne({ channelId: channel.id });
        await updatePanel(channel, member, updatedDoc);
        return interaction.reply({ content: `${blackEmoji.yes} Channel is now **visible**.`, flags: MessageFlags.Ephemeral });
      } else {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false });
        await J2CChannel.updateOne({ _id: vcDoc._id }, { hidden: true });
        const updatedDoc = await J2CChannel.findOne({ channelId: channel.id });
        await updatePanel(channel, member, updatedDoc);
        return interaction.reply({ content: `${blackEmoji.yes} Channel is now **hidden**.`, flags: MessageFlags.Ephemeral });
      }
    }
    case 'rename': {
      const modal = new ModalBuilder()
        .setCustomId('j2c_modal:rename')
        .setTitle('Rename Channel');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('j2c_new_name')
            .setLabel('New channel name')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setRequired(true)
            .setPlaceholder(channel.name)
        )
      );
      return interaction.showModal(modal);
    }
    case 'limit': {
      const modal = new ModalBuilder()
        .setCustomId('j2c_modal:limit')
        .setTitle('Set User Limit');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('j2c_new_limit')
            .setLabel('User limit (0 = unlimited, max 99)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(2)
            .setRequired(true)
            .setPlaceholder('0')
        )
      );
      return interaction.showModal(modal);
    }
    case 'bitrate': {
      const modal = new ModalBuilder()
        .setCustomId('j2c_modal:bitrate')
        .setTitle('Set Bitrate');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('j2c_new_bitrate')
            .setLabel(`Bitrate in kbps (8-${Math.floor(guild.maximumBitrate / 1000)})`)
            .setStyle(TextInputStyle.Short)
            .setMaxLength(3)
            .setRequired(true)
            .setPlaceholder('64')
        )
      );
      return interaction.showModal(modal);
    }
    case 'transfer': {
      const modal = new ModalBuilder()
        .setCustomId('j2c_modal:transfer')
        .setTitle('Transfer Ownership');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('j2c_transfer_user')
            .setLabel('User ID of new owner (must be in channel)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(20)
            .setRequired(true)
            .setPlaceholder('123456789012345678')
        )
      );
      return interaction.showModal(modal);
    }
    case 'permit': {
      const modal = new ModalBuilder()
        .setCustomId('j2c_modal:permit')
        .setTitle('Permit User');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('j2c_permit_user')
            .setLabel('User ID to permit')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(20)
            .setRequired(true)
            .setPlaceholder('123456789012345678')
        )
      );
      return interaction.showModal(modal);
    }
    case 'reject': {
      const modal = new ModalBuilder()
        .setCustomId('j2c_modal:reject')
        .setTitle('Ban / Reject User');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('j2c_reject_user')
            .setLabel('User ID to ban from your channel')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(20)
            .setRequired(true)
            .setPlaceholder('123456789012345678')
        )
      );
      return interaction.showModal(modal);
    }
    case 'info': {
      const owner = await client.users.fetch(vcDoc.ownerId).catch(() => null);
      const createdAgo = `<t:${Math.floor(vcDoc.createdAt.getTime() / 1000)}:R>`;
      const lockStatus = vcDoc.locked ? `${blackEmoji.on} Locked` : `${blackEmoji.off} Unlocked`;
      const hideStatus = vcDoc.hidden ? `${blackEmoji.on} Hidden` : `${blackEmoji.off} Visible`;

      let infoText =
        `### ${blackEmoji.cog} Channel Info\n` +
        `> **Owner:** ${owner ? `<@${owner.id}>` : 'Unknown'}\n` +
        `> **Status:** ${lockStatus}\n` +
        `> **Visibility:** ${hideStatus}\n` +
        `> **Limit:** \`${channel.userLimit}\`\n` +
        `> **Bitrate:** \`${Math.floor(channel.bitrate / 1000)}kbps\`\n` +
        `> **Region:** \`${channel.rtcRegion}\`\n` +
        `> **Members:** \`${channel.members.size}\`\n` +
        `> **Created:** ${createdAgo}`;

      if (vcDoc.permittedUsers.length > 0) {
        infoText += `\n\n### ${blackEmoji.yes} Permitted\n${vcDoc.permittedUsers.map(id => `> <@${id}>`).join('\n')}`;
      }
      if (vcDoc.bannedUsers.length > 0) {
        infoText += `\n\n### ${blackEmoji.no} Banned\n${vcDoc.bannedUsers.map(id => `> <@${id}>`).join('\n')}`;
      }

      return interaction.reply({ content: infoText, flags: MessageFlags.Ephemeral });
    }
    default:
      return interaction.reply({ content: `${blackEmoji.no} Unknown action.`, flags: MessageFlags.Ephemeral });
  }
}

async function handleJ2CModal(client, interaction) {
  const action = interaction.customId.replace('j2c_modal:', '');
  const member = interaction.member;
  const guild = interaction.guild;

  if (!member.voice.channel) {
    return interaction.reply({ content: `${blackEmoji.no} You must be in a voice channel.`, flags: MessageFlags.Ephemeral });
  }

  const vcDoc = await J2CChannel.findOne({ channelId: member.voice.channelId, ownerId: member.id });
  if (!vcDoc) {
    return interaction.reply({ content: `${blackEmoji.no} You don't own this channel or it's not a J2C channel.`, flags: MessageFlags.Ephemeral });
  }

  const channel = member.voice.channel;

  switch (action) {
    case 'rename': {
      const newName = interaction.fields.getTextInputValue('j2c_new_name').slice(0, 100);
      await channel.setName(newName).catch(() => {});
      return interaction.reply({ content: `${blackEmoji.yes} Channel renamed to **${newName}**.`, flags: MessageFlags.Ephemeral });
    }
    case 'limit': {
      const limit = parseInt(interaction.fields.getTextInputValue('j2c_new_limit'));
      if (isNaN(limit) || limit < 0 || limit > 99) {
        return interaction.reply({ content: `${blackEmoji.no} Limit must be **0-99**.`, flags: MessageFlags.Ephemeral });
      }
      await channel.setUserLimit(limit).catch(() => {});
      const updatedDoc = await J2CChannel.findOne({ channelId: channel.id });
      await updatePanel(channel, member, updatedDoc);
      return interaction.reply({ content: `${blackEmoji.yes} Limit set to **${limit === 0 ? 'Unlimited' : limit}**.`, flags: MessageFlags.Ephemeral });
    }
    case 'bitrate': {
      const bitrate = parseInt(interaction.fields.getTextInputValue('j2c_new_bitrate'));
      const maxKbps = Math.floor(guild.maximumBitrate / 1000);
      if (isNaN(bitrate) || bitrate < 8 || bitrate > maxKbps) {
        return interaction.reply({ content: `${blackEmoji.no} Bitrate must be **8-${maxKbps}** kbps.`, flags: MessageFlags.Ephemeral });
      }
      await channel.setBitrate(bitrate * 1000).catch(() => {});
      await J2CChannel.updateOne({ _id: vcDoc._id }, { bitrate: bitrate * 1000 });
      const updatedDoc = await J2CChannel.findOne({ channelId: channel.id });
      await updatePanel(channel, member, updatedDoc);
      return interaction.reply({ content: `${blackEmoji.yes} Bitrate set to **${bitrate}kbps**.`, flags: MessageFlags.Ephemeral });
    }
    case 'transfer': {
      const userId = interaction.fields.getTextInputValue('j2c_transfer_user').trim();
      const target = channel.members.get(userId);
      if (!target) {
        return interaction.reply({ content: `${blackEmoji.no} User not found in your channel. Make sure they are in the voice channel and you provided their User ID.`, flags: MessageFlags.Ephemeral });
      }
      await channel.permissionOverwrites.edit(target.user, {
        ManageChannels: true, MoveMembers: true, Connect: true, Speak: true
      });
      await channel.permissionOverwrites.edit(member.user, {
        ManageChannels: null, MoveMembers: null, Connect: true, Speak: true
      });
      await J2CChannel.updateOne({ _id: vcDoc._id }, { ownerId: target.id });
      const updatedDoc = await J2CChannel.findOne({ channelId: channel.id });
      await updatePanel(channel, target, updatedDoc);
      return interaction.reply({ content: `${blackEmoji.yes} Ownership transferred to **${target.user.tag}**.`, flags: MessageFlags.Ephemeral });
    }
    case 'permit': {
      const userId = interaction.fields.getTextInputValue('j2c_permit_user').trim();
      const target = await guild.members.fetch(userId).catch(() => null);
      if (!target) {
        return interaction.reply({ content: `${blackEmoji.no} Invalid user ID.`, flags: MessageFlags.Ephemeral });
      }
      await channel.permissionOverwrites.edit(target.user, { Connect: true });
      await J2CChannel.updateOne({ _id: vcDoc._id }, { $addToSet: { permittedUsers: target.id } });
      return interaction.reply({ content: `${blackEmoji.yes} **${target.user.tag}** can now join your channel.`, flags: MessageFlags.Ephemeral });
    }
    case 'reject': {
      const userId = interaction.fields.getTextInputValue('j2c_reject_user').trim();
      const target = await guild.members.fetch(userId).catch(() => null);
      if (!target) {
        return interaction.reply({ content: `${blackEmoji.no} Invalid user ID.`, flags: MessageFlags.Ephemeral });
      }
      if (target.id === member.id) {
        return interaction.reply({ content: `${blackEmoji.no} You cannot ban yourself.`, flags: MessageFlags.Ephemeral });
      }
      await channel.permissionOverwrites.edit(target.user, { Connect: false });
      await J2CChannel.updateOne({ _id: vcDoc._id }, {
        $addToSet: { bannedUsers: target.id },
        $pull: { permittedUsers: target.id }
      });
      if (target.voice.channelId === channel.id) {
        await target.voice.disconnect('Banned from J2C channel').catch(() => {});
      }
      return interaction.reply({ content: `${blackEmoji.yes} **${target.user.tag}** has been banned from your channel.`, flags: MessageFlags.Ephemeral });
    }
    default:
      return interaction.reply({ content: `${blackEmoji.no} Unknown action.`, flags: MessageFlags.Ephemeral });
  }
}

async function updatePanel(channel, owner, j2cDoc) {
  if (!j2cDoc?.interfaceMessageId) return;
  try {
    const panelMsg = await channel.messages.fetch(j2cDoc.interfaceMessageId).catch(() => null);
    if (!panelMsg) return;
    const panelData = buildJ2CPanel(channel, owner, j2cDoc);
    await panelMsg.edit(panelData);
  } catch (_) {}
}

async function handleEmbedButton(client, interaction) {
  const [_, name, field, userId] = interaction.customId.split(':');
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: `${blackEmoji.no} Only the embed editor may use this button.`, flags: MessageFlags.Ephemeral });
  }

  const doc = await CustomEmbed.findOne({ guildId: interaction.guild.id, name });
  if (!doc) {
    return interaction.reply({ content: `${blackEmoji.no} Embed not found.`, flags: MessageFlags.Ephemeral });
  }

  if (field === 'clearfields') {
    await CustomEmbed.findOneAndUpdate(
      { guildId: interaction.guild.id, name },
      { $set: { fields: [], updatedAt: new Date() } },
      { new: true }
    );
    return interaction.reply({ content: `${blackEmoji.yes} All fields cleared for embed **${name}**.`, flags: MessageFlags.Ephemeral });
  }

  const modal = new ModalBuilder()
    .setCustomId(`embed_modal:${name}:${field}:${userId}`)
    .setTitle(`Edit ${field === 'fields' ? 'Fields' : field.charAt(0).toUpperCase() + field.slice(1)}`);

  const addInput = (customId, label, style, placeholder, required = true, maxLength = 4000) =>
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setStyle(style)
        .setRequired(required)
        .setMaxLength(maxLength)
        .setPlaceholder(placeholder || '')
    );

  switch (field) {
    case 'title':
      modal.addComponents(addInput('embed_value', 'Title', TextInputStyle.Short, doc.title || ''));
      break;
    case 'description':
      modal.addComponents(addInput('embed_value', 'Description', TextInputStyle.Paragraph, doc.description || '', true, 4000));
      break;
    case 'color':
      modal.addComponents(addInput('embed_value', 'Color name or hex code', TextInputStyle.Short, doc.color || '#ffffff', true, 100));
      break;
    case 'url':
      modal.addComponents(addInput('embed_value', 'Title URL', TextInputStyle.Short, doc.url || ''));
      break;
    case 'footer':
      modal.addComponents(addInput('embed_value', 'Footer text', TextInputStyle.Short, doc.footer || ''));
      break;
    case 'footerIcon':
      modal.addComponents(addInput('embed_value', 'Footer icon URL', TextInputStyle.Short, doc.footerIcon || ''));
      break;
    case 'author':
      modal.addComponents(addInput('embed_value', 'Author name', TextInputStyle.Short, doc.author || ''));
      break;
    case 'authorIcon':
      modal.addComponents(addInput('embed_value', 'Author icon URL', TextInputStyle.Short, doc.authorIcon || ''));
      break;
    case 'authorUrl':
      modal.addComponents(addInput('embed_value', 'Author URL', TextInputStyle.Short, doc.authorUrl || ''));
      break;
    case 'image':
      modal.addComponents(addInput('embed_value', 'Image URL', TextInputStyle.Short, doc.image || ''));
      break;
    case 'thumbnail':
      modal.addComponents(addInput('embed_value', 'Thumbnail URL', TextInputStyle.Short, doc.thumbnail || ''));
      break;
    case 'fields':
      modal.addComponents(
        addInput('field_name', 'Field title', TextInputStyle.Short, ''),
        addInput('field_value', 'Field value', TextInputStyle.Paragraph, '' , true, 1024),
        addInput('field_inline', 'Inline? true/false', TextInputStyle.Short, 'false', true, 5)
      );
      break;
    default:
      return interaction.reply({ content: `${blackEmoji.no} Unknown editor button.`, flags: MessageFlags.Ephemeral });
  }

  return interaction.showModal(modal);
}

async function handleEmbedModal(client, interaction) {
  const [_, name, field, userId] = interaction.customId.split(':');
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: `${blackEmoji.no} Only the embed editor may submit this form.`, flags: MessageFlags.Ephemeral });
  }

  const doc = await CustomEmbed.findOne({ guildId: interaction.guild.id, name });
  if (!doc) {
    return interaction.reply({ content: `${blackEmoji.no} Embed not found.`, flags: MessageFlags.Ephemeral });
  }

  const update = {};
  let replyText = '';

  switch (field) {
    case 'title':
      update.title = interaction.fields.getTextInputValue('embed_value').slice(0, 256);
      replyText = 'Title';
      break;
    case 'description':
      update.description = interaction.fields.getTextInputValue('embed_value').slice(0, 4000);
      replyText = 'Description';
      break;
    case 'color': {
      const colorInput = interaction.fields.getTextInputValue('embed_value').trim();
      const color = resolveColor(colorInput);
      if (!color) {
        return interaction.reply({ content: `${blackEmoji.no} Invalid color. Use a named color or hex code like #ff0000.`, flags: MessageFlags.Ephemeral });
      }
      update.color = color;
      replyText = 'Color';
      break;
    }
    case 'url':
      update.url = interaction.fields.getTextInputValue('embed_value').trim();
      replyText = 'Title URL';
      break;
    case 'footer':
      update.footer = interaction.fields.getTextInputValue('embed_value').slice(0, 2048);
      replyText = 'Footer';
      break;
    case 'footerIcon':
      update.footerIcon = interaction.fields.getTextInputValue('embed_value').trim();
      replyText = 'Footer Icon';
      break;
    case 'author':
      update.author = interaction.fields.getTextInputValue('embed_value').slice(0, 256);
      replyText = 'Author';
      break;
    case 'authorIcon':
      update.authorIcon = interaction.fields.getTextInputValue('embed_value').trim();
      replyText = 'Author Icon';
      break;
    case 'authorUrl':
      update.authorUrl = interaction.fields.getTextInputValue('embed_value').trim();
      replyText = 'Author URL';
      break;
    case 'image':
      update.image = interaction.fields.getTextInputValue('embed_value').trim();
      replyText = 'Image';
      break;
    case 'thumbnail':
      update.thumbnail = interaction.fields.getTextInputValue('embed_value').trim();
      replyText = 'Thumbnail';
      break;
    case 'fields': {
      const nameValue = interaction.fields.getTextInputValue('field_name').slice(0, 256);
      const valueValue = interaction.fields.getTextInputValue('field_value').slice(0, 1024);
      const inlineValue = interaction.fields.getTextInputValue('field_inline').trim().toLowerCase();
      const inline = inlineValue === 'true';
      await CustomEmbed.findOneAndUpdate(
        { guildId: interaction.guild.id, name },
        { $push: { fields: { name: nameValue, value: valueValue, inline } }, $set: { updatedAt: new Date() } },
        { new: true }
      );
      return interaction.reply({ content: `${blackEmoji.yes} Field added to embed **${name}**.`, flags: MessageFlags.Ephemeral });
    }
    default:
      return interaction.reply({ content: `${blackEmoji.no} Unknown editor action.`, flags: MessageFlags.Ephemeral });
  }

  await CustomEmbed.findOneAndUpdate(
    { guildId: interaction.guild.id, name },
    { $set: { ...update, updatedAt: new Date() } },
    { new: true }
  );

  return interaction.reply({ content: `${blackEmoji.yes} Updated ${replyText} for embed **${name}**.`, flags: MessageFlags.Ephemeral });
}

function resolveColor(input) {
  if (!input) return null;
  const lower = input.toLowerCase();
  const colorMap = {
    red: '#e74c3c', blue: '#3498db', green: '#2ecc71', yellow: '#f1c40f',
    purple: '#9b59b6', pink: '#e91e63', orange: '#e67e22', white: '#ffffff',
    black: '#000000', cyan: '#1abc9c', gold: '#f39c12', gray: '#95a5a6',
    lime: '#00ff00', navy: '#34495e', teal: '#008080', coral: '#ff7f50',
  };
  if (colorMap[lower]) return colorMap[lower];
  if (/^#?[0-9a-f]{6}$/i.test(input)) return input.startsWith('#') ? input : `#${input}`;
  return null;
}
