const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionsBitField, MessageFlags } = require('discord.js');
const Ticket = require('@db/tickets.js');
const blackEmoji = require('@assets/emojis/black.js');

async function handleTicketInteraction(client, interaction) {
  const id = interaction.customId;

  if (interaction.isButton()) {
    if (id === 'ticket_create') return handleCreateButton(client, interaction);
    if (id === 'ticket_close') return handleCloseButton(client, interaction);
    if (id === 'ticket_close_confirm') return handleCloseConfirm(client, interaction);
    if (id === 'ticket_close_cancel') return handleCloseCancel(client, interaction);
    if (id === 'ticket_claim') return handleClaim(client, interaction);
  }

  if (interaction.isStringSelectMenu()) {
    if (id === 'ticket_category_select') return handleCategorySelect(client, interaction);
  }

  if (interaction.isModalSubmit()) {
    if (id === 'ticket_reason_modal') return handleReasonModal(client, interaction);
    if (id.startsWith('ticket_reason_cat_')) return handleReasonModal(client, interaction);
  }

  return false;
}

async function handleCreateButton(client, interaction) {
  const doc = await Ticket.findOne({ guildId: interaction.guild.id });
  if (!doc?.enabled) {
    return interaction.reply({ content: `${blackEmoji.no} The ticket system is not set up.`, flags: MessageFlags.Ephemeral });
  }

  const userOpenTickets = doc.openTickets?.filter(t => t.userId === interaction.user.id) || [];
  if (userOpenTickets.length >= doc.maxTicketsPerUser) {
    const existingChannel = userOpenTickets[0]?.channelId;
    return interaction.reply({
      content: `${blackEmoji.no} You already have ${userOpenTickets.length} open ticket(s). Maximum is **${doc.maxTicketsPerUser}**.${existingChannel ? `\n${blackEmoji.arrow} Go to <#${existingChannel}>` : ''}`,
      flags: MessageFlags.Ephemeral
    });
  }

  if (doc.categories?.length > 0) {
    const options = doc.categories.map(cat => ({
      label: cat.name,
      value: cat.name,
      emoji: cat.emoji || '🎫',
      description: cat.description || undefined
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_category_select')
        .setPlaceholder('Select a ticket category')
        .addOptions(options)
    );

    return interaction.reply({
      content: `${blackEmoji.channel} **Select a category for your ticket:**`,
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }

  const modal = new ModalBuilder()
    .setCustomId('ticket_reason_modal')
    .setTitle('Create a Ticket');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('ticket_reason')
        .setLabel('What do you need help with?')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(1000)
        .setRequired(false)
        .setPlaceholder('Describe your issue or question...')
    )
  );
  return interaction.showModal(modal);
}

async function handleCategorySelect(client, interaction) {
  const category = interaction.values[0];

  const safeCategory = category.slice(0, 60);
  const modal = new ModalBuilder()
    .setCustomId(`ticket_reason_cat_${safeCategory}`)
    .setTitle(`${category.slice(0, 35)} — Create Ticket`);
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('ticket_reason')
        .setLabel('What do you need help with?')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(1000)
        .setRequired(false)
        .setPlaceholder('Describe your issue or question...')
    )
  );
  return interaction.showModal(modal);
}

async function handleReasonModal(client, interaction) {
  const reason = interaction.fields.getTextInputValue('ticket_reason')?.trim() || null;
  let category = 'General';

  if (interaction.customId.startsWith('ticket_reason_cat_')) {
    category = interaction.customId.replace('ticket_reason_cat_', '');
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const doc = await Ticket.findOne({ guildId: interaction.guild.id });
  if (!doc?.enabled) {
    return interaction.editReply({ content: `${blackEmoji.no} The ticket system is not set up.` });
  }

  const userOpenTickets = doc.openTickets?.filter(t => t.userId === interaction.user.id) || [];
  if (userOpenTickets.length >= doc.maxTicketsPerUser) {
    return interaction.editReply({ content: `${blackEmoji.no} You already have the maximum number of open tickets.` });
  }

  doc.ticketCount = (doc.ticketCount || 0) + 1;
  const ticketNumber = doc.ticketCount;
  const paddedNumber = String(ticketNumber).padStart(4, '0');

  let channelName = (doc.ticketNameFormat || 'ticket-{number}')
    .replace('{number}', paddedNumber)
    .replace('{username}', interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, ''));

  let parentId = doc.categoryId;
  let ticketStaffRole = doc.staffRoleId;

  const catConfig = doc.categories?.find(c => c.name === category);
  if (catConfig) {
    if (catConfig.categoryId) parentId = catConfig.categoryId;
    if (catConfig.staffRoleId) ticketStaffRole = catConfig.staffRoleId;
  }

  const permissionOverwrites = [
    {
      id: interaction.guild.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.EmbedLinks
      ]
    },
    {
      id: client.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    }
  ];

  if (ticketStaffRole) {
    permissionOverwrites.push({
      id: ticketStaffRole,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.ManageMessages
      ]
    });
  }

  try {
    const ticketChannel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: parentId || null,
      permissionOverwrites,
      topic: `Ticket #${paddedNumber} | ${interaction.user.tag} | ${category}${reason ? ` | ${reason.slice(0, 100)}` : ''}`
    });

    doc.openTickets.push({
      channelId: ticketChannel.id,
      userId: interaction.user.id,
      ticketNumber,
      category,
      topic: reason,
      openedAt: new Date()
    });
    await doc.save();

    const welcomeC = new ContainerBuilder();
    welcomeC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `# ${blackEmoji.channel} Ticket #${paddedNumber}\n` +
      `${blackEmoji.user} **Opened By:** ${interaction.user} | ${blackEmoji.list} **Category:** ${category} | ${blackEmoji.time} **Opened:** <t:${Math.floor(Date.now() / 1000)}:R>` +
      (reason ? `\n${blackEmoji.message} **Reason:** ${reason}` : '') +
      `\n\n${blackEmoji.info} A staff member will assist you shortly.\n${blackEmoji.arrow} Describe your issue in detail to get faster help.\n-# ${interaction.guild.name} • Ticket System`
    ));
    welcomeC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    welcomeC.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Success).setEmoji('✋'),
        new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
      )
    );

    const staffPing = ticketStaffRole ? `<@&${ticketStaffRole}> ` : '';
    await ticketChannel.send({
      content: `${staffPing}${interaction.user}`,
      components: [welcomeC],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: ['users', 'roles'] }
    });

    await interaction.editReply({
      content: `${blackEmoji.yes} Your ticket has been created! Go to ${ticketChannel}`
    });

    if (doc.logChannelId) {
      const logChannel = interaction.guild.channels.cache.get(doc.logChannelId);
      if (logChannel) {
        const logC = new ContainerBuilder();
        logC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.channel} Ticket Opened`));
        logC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        logC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.user} **User:** ${interaction.user} (${interaction.user.id})\n` +
          `${blackEmoji.channel} **Channel:** ${ticketChannel}\n` +
          `${blackEmoji.list} **Category:** ${category}\n` +
          `${blackEmoji.arrow} **Ticket:** #${paddedNumber}\n` +
          `${blackEmoji.time} <t:${Math.floor(Date.now() / 1000)}:F>`
        ));
        logChannel.send({ components: [logC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Error creating ticket channel:', err);
    return interaction.editReply({
      content: `${blackEmoji.no} Failed to create ticket channel. Make sure I have the **Manage Channels** permission and a valid category is set.`
    });
  }
}

async function handleClaim(client, interaction) {
  const doc = await Ticket.findOne({ guildId: interaction.guild.id });
  if (!doc) return interaction.reply({ content: `${blackEmoji.no} Ticket system not configured.`, flags: MessageFlags.Ephemeral });

  const ticket = doc.openTickets?.find(t => t.channelId === interaction.channel.id);
  if (!ticket) return interaction.reply({ content: `${blackEmoji.no} This is not an active ticket channel.`, flags: MessageFlags.Ephemeral });

  const isStaff = doc.staffRoleId && interaction.member.roles.cache.has(doc.staffRoleId);
  const catConfig = doc.categories?.find(c => c.name === ticket.category);
  const isCatStaff = catConfig?.staffRoleId && interaction.member.roles.cache.has(catConfig.staffRoleId);
  const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild);
  if (!isStaff && !isCatStaff && !isAdmin) {
    return interaction.reply({ content: `${blackEmoji.no} Only staff members can claim tickets.`, flags: MessageFlags.Ephemeral });
  }

  if (ticket.claimedBy) {
    return interaction.reply({ content: `${blackEmoji.no} This ticket is already claimed by <@${ticket.claimedBy}>.`, flags: MessageFlags.Ephemeral });
  }

  ticket.claimedBy = interaction.user.id;
  doc.updatedAt = new Date();
  await doc.save();

  const paddedNumber = String(ticket.ticketNumber).padStart(4, '0');

  const claimedC = new ContainerBuilder();
  claimedC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `# ${blackEmoji.channel} Ticket #${paddedNumber}\n` +
    `${blackEmoji.user} **Opened By:** <@${ticket.userId}> | ${blackEmoji.list} **Category:** ${ticket.category} | ${blackEmoji.time} **Opened:** <t:${Math.floor(new Date(ticket.openedAt).getTime() / 1000)}:R>\n` +
    `✋ **Claimed By:** ${interaction.user}` +
    (ticket.topic ? `\n\n${blackEmoji.message} **Reason:**\n> ${ticket.topic}` : '') +
    `\n-# ${interaction.guild.name} • Ticket System`
  ));
  claimedC.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
  claimedC.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claimed').setStyle(ButtonStyle.Success).setEmoji('✋').setDisabled(true),
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    )
  );

  await interaction.update({
    components: [claimedC],
    flags: MessageFlags.IsComponentsV2
  });

  const followC = new ContainerBuilder();
  followC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `${blackEmoji.yes} **Ticket Claimed**\n` +
    `${blackEmoji.user} **Handler:** ${interaction.user}\n` +
    `${blackEmoji.arrow} This ticket (#${paddedNumber}) is now being handled by ${interaction.user}.`
  ));

  await interaction.followUp({ components: [followC], flags: MessageFlags.IsComponentsV2 });
}

async function handleCloseButton(client, interaction) {
  const doc = await Ticket.findOne({ guildId: interaction.guild.id });
  if (!doc) return interaction.reply({ content: `${blackEmoji.no} Ticket system not configured.`, flags: MessageFlags.Ephemeral });

  const ticket = doc.openTickets?.find(t => t.channelId === interaction.channel.id);
  if (!ticket) return interaction.reply({ content: `${blackEmoji.no} This is not an active ticket channel.`, flags: MessageFlags.Ephemeral });

  const isOwner = ticket.userId === interaction.user.id;
  const isStaff = doc.staffRoleId && interaction.member.roles.cache.has(doc.staffRoleId);
  const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild);
  if (!isOwner && !isStaff && !isAdmin) {
    return interaction.reply({ content: `${blackEmoji.no} Only the ticket owner or staff can close this ticket.`, flags: MessageFlags.Ephemeral });
  }

  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Close Ticket?`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `${blackEmoji.arrow} Are you sure you want to close this ticket?\n` +
    `${blackEmoji.arrow} A transcript will be saved before closing.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('Close Ticket').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket_close_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    )
  );

  return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
}

async function handleCloseCancel(client, interaction) {
  return interaction.message.delete().catch(() =>
    interaction.reply({ content: `${blackEmoji.no} Close cancelled.`, flags: MessageFlags.Ephemeral })
  );
}

async function handleCloseConfirm(client, interaction) {
  const doc = await Ticket.findOne({ guildId: interaction.guild.id });
  if (!doc) return interaction.reply({ content: `${blackEmoji.no} Ticket system not configured.`, flags: MessageFlags.Ephemeral });

  const ticket = doc.openTickets?.find(t => t.channelId === interaction.channel.id);
  if (!ticket) return interaction.reply({ content: `${blackEmoji.no} This is not an active ticket channel.`, flags: MessageFlags.Ephemeral });

  const isOwner = ticket.userId === interaction.user.id;
  const isStaff = doc.staffRoleId && interaction.member.roles.cache.has(doc.staffRoleId);
  const catConfig = doc.categories?.find(c => c.name === ticket.category);
  const isCatStaff = catConfig?.staffRoleId && interaction.member.roles.cache.has(catConfig.staffRoleId);
  const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild);
  if (!isOwner && !isStaff && !isCatStaff && !isAdmin) {
    return interaction.reply({ content: `${blackEmoji.no} Only the ticket owner or staff can close this ticket.`, flags: MessageFlags.Ephemeral });
  }

  await interaction.deferUpdate();

  const paddedNumber = String(ticket.ticketNumber).padStart(4, '0');
  const closedBy = interaction.user;

  const transcript = await generateTranscript(interaction.channel, ticket, interaction.guild);

  if (doc.transcriptChannelId) {
    const transcriptChannel = interaction.guild.channels.cache.get(doc.transcriptChannelId);
    if (transcriptChannel) {
      const opener = await interaction.client.users.fetch(ticket.userId).catch(() => null);

      const tC = new ContainerBuilder();
      tC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.files} Ticket Transcript — #${paddedNumber}`));
      tC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      tC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **Opened by:** ${opener || `Unknown (${ticket.userId})`}\n` +
        `${blackEmoji.user} **Closed by:** ${closedBy}\n` +
        `${blackEmoji.list} **Category:** ${ticket.category}\n` +
        `${blackEmoji.time} **Opened:** <t:${Math.floor(new Date(ticket.openedAt).getTime() / 1000)}:F>\n` +
        `${blackEmoji.time} **Closed:** <t:${Math.floor(Date.now() / 1000)}:F>${ticket.claimedBy ? `\n✋ **Handler:** <@${ticket.claimedBy}>` : ''}${ticket.topic ? `\n${blackEmoji.message} **Topic:** ${ticket.topic}` : ''}`
      ));

      await transcriptChannel.send({ components: [tC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

      if (transcript.length > 0) {
        const transcriptText = transcript.join('\n');
        const buffer = Buffer.from(transcriptText, 'utf-8');
        await transcriptChannel.send({
          files: [{ attachment: buffer, name: `transcript-${paddedNumber}.txt` }]
        }).catch(() => {});
      }
    }
  }

  if (doc.logChannelId) {
    const logChannel = interaction.guild.channels.cache.get(doc.logChannelId);
    if (logChannel) {
      const logC = new ContainerBuilder();
      logC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🔒 Ticket Closed`));
      logC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      logC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **Opened by:** <@${ticket.userId}>\n` +
        `${blackEmoji.user} **Closed by:** ${closedBy}\n` +
        `${blackEmoji.arrow} **Ticket:** #${paddedNumber}\n` +
        `${blackEmoji.list} **Category:** ${ticket.category}\n` +
        `${blackEmoji.time} <t:${Math.floor(Date.now() / 1000)}:F>`
      ));
      logChannel.send({ components: [logC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  }

  doc.openTickets = doc.openTickets.filter(t => t.channelId !== interaction.channel.id);
  doc.updatedAt = new Date();
  await doc.save();

  const closeC = new ContainerBuilder();
  closeC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🔒 Ticket Closed`));
  closeC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  closeC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `${blackEmoji.arrow} This ticket has been closed by ${closedBy}.\n` +
    `${blackEmoji.arrow} This channel will be deleted in **5 seconds**.`
  ));

  await interaction.editReply({ components: [closeC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

  setTimeout(() => {
    interaction.channel.delete(`Ticket #${paddedNumber} closed by ${closedBy.tag}`).catch(() => {});
  }, 5000);
}

async function generateTranscript(channel, ticket, guild) {
  const lines = [];
  const paddedNumber = String(ticket.ticketNumber).padStart(4, '0');

  lines.push(`=== Ticket #${paddedNumber} Transcript ===`);
  lines.push(`Guild: ${guild.name} (${guild.id})`);
  lines.push(`Channel: #${channel.name}`);
  lines.push(`Opened by: ${ticket.userId}`);
  lines.push(`Category: ${ticket.category}`);
  lines.push(`Opened at: ${new Date(ticket.openedAt).toISOString()}`);
  lines.push(`Closed at: ${new Date().toISOString()}`);
  if (ticket.claimedBy) lines.push(`Claimed by: ${ticket.claimedBy}`);
  if (ticket.topic) lines.push(`Topic: ${ticket.topic}`);
  lines.push('='.repeat(50));
  lines.push('');

  try {
    let allMessages = [];
    let lastId;

    while (true) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;
      const batch = await channel.messages.fetch(options);
      if (batch.size === 0) break;
      allMessages.push(...batch.values());
      lastId = batch.last().id;
      if (batch.size < 100) break;
    }

    allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    for (const msg of allMessages) {
      const timestamp = msg.createdAt.toISOString().replace('T', ' ').slice(0, 19);
      const author = msg.author?.tag || 'Unknown';
      let content = msg.content || '';

      if (msg.attachments.size > 0) {
        const attachments = msg.attachments.map(a => a.url).join(', ');
        content += content ? ` [Attachments: ${attachments}]` : `[Attachments: ${attachments}]`;
      }

      if (msg.embeds?.length > 0) {
        content += content ? ' [Embed]' : '[Embed]';
      }

      if (msg.stickers?.size > 0) {
        content += content ? ' [Sticker]' : '[Sticker]';
      }

      if (content) {
        lines.push(`[${timestamp}] ${author}: ${content}`);
      }
    }
  } catch (err) {
    lines.push('[Error fetching messages]');
  }

  return lines;
}

module.exports = { handleTicketInteraction };
