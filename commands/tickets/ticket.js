const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Ticket = require('@db/tickets.js');

module.exports = {
  name: 'ticket',
  aliases: ['tickets', 'tc'],
  cooldown: '3',
  category: 'tickets',
  usage: '<setup|panel|staff|category|log|transcript|limit|addcategory|removecategory|categories|adduser|removeuser|close|claim|rename|topic|config|reset>',
  description: 'Full ticket system management — create panels, configure staff, categories, transcripts, and more',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageChannels', 'ManageRoles'],
  userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,

  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();

    const adminActions = ['setup', 'panel', 'staff', 'category', 'setcategory', 'log', 'limit', 'addcategory', 'removecategory', 'clearcategories', 'config', 'paneltitle', 'paneldesc', 'buttonlabel', 'buttoncolor', 'buttonemoji', 'name', 'format', 'reset', 'disable'];
    if (adminActions.includes(action) && !message.member.permissions.has('ManageGuild')) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You need the **Manage Server** permission to use this.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'setup') {
      let doc = await Ticket.findOne({ guildId: message.guild.id });
      if (!doc) {
        doc = await Ticket.create({ guildId: message.guild.id, enabled: true });
      } else {
        doc.enabled = true;
        doc.updatedAt = new Date();
        await doc.save();
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Ticket System Enabled`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} The ticket system has been enabled.\n\n**Quick Setup:**\n` +
        `\`1.\` \`${client.prefix}ticket staff @role\` — Set support team role\n` +
        `\`2.\` \`${client.prefix}ticket category <categoryId>\` — Set ticket channel category\n` +
        `\`3.\` \`${client.prefix}ticket log #channel\` — Set log channel\n` +
        `\`4.\` \`${client.prefix}ticket transcript #channel\` — Set transcript channel\n` +
        `\`5.\` \`${client.prefix}ticket panel\` — Create the ticket panel`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'panel') {
      const doc = await Ticket.findOne({ guildId: message.guild.id });
      if (!doc?.enabled) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Run \`${client.prefix}ticket setup\` first.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const title = doc.panelTitle;
      const description = doc.panelDescription;
      const buttonLabel = doc.panelButtonLabel;
      const buttonEmoji = doc.panelButtonEmoji;
      const colorMap = { Primary: ButtonStyle.Primary, Secondary: ButtonStyle.Secondary, Success: ButtonStyle.Success, Danger: ButtonStyle.Danger };
      const buttonColor = colorMap[doc.panelButtonColor] || ButtonStyle.Primary;

      const panelC = new ContainerBuilder();
      panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.channel} ${title}`));
      panelC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(description));

      if (doc.categories?.length > 0) {
        const catList = doc.categories.map(ct => `${ct.emoji} **${ct.name}**${ct.description ? ` — ${ct.description}` : ''}`).join('\n');
        panelC.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Categories:**\n${catList}`));
      }

      panelC.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      panelC.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_create').setLabel(buttonLabel).setStyle(buttonColor).setEmoji(buttonEmoji)
        )
      );

      if (doc.panelMessageId && doc.panelChannelId) {
        try {
          const oldChannel = message.guild.channels.cache.get(doc.panelChannelId);
          if (oldChannel) {
            const oldMsg = await oldChannel.messages.fetch(doc.panelMessageId).catch(() => null);
            if (oldMsg) await oldMsg.delete().catch(() => {});
          }
        } catch {}
      }

      const panelMsg = await message.channel.send({ components: [panelC], flags: MessageFlags.IsComponentsV2 });
      doc.panelChannelId = message.channel.id;
      doc.panelMessageId = panelMsg.id;
      doc.updatedAt = new Date();
      await doc.save();

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Ticket panel has been created in this channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'staff') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.info} Ticket Staff Role\n\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}ticket staff @role\`\n` +
          `${blackEmoji.arrow} Staff members with this role can view and manage tickets.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Ticket.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { staffRoleId: role.id, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Staff Role Updated`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Ticket staff role set to ${role}\n` +
        `${blackEmoji.arrow} Members with this role will have access to all tickets.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'category' || action === 'setcategory') {
      const catChannel = message.guild.channels.cache.get(args[1]);
      if (!catChannel || catChannel.type !== ChannelType.GuildCategory) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.info} Ticket Category Channel\n\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}ticket category <categoryId>\`\n` +
          `${blackEmoji.arrow} Provide the ID of a **category channel** where tickets will be created.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Ticket.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { categoryId: catChannel.id, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Category Updated`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Tickets will be created under **${catChannel.name}**`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'log') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.info} Ticket Log Channel\n\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}ticket log #channel\`\n` +
          `${blackEmoji.arrow} Ticket open/close events will be logged here.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Ticket.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { logChannelId: channel.id, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Ticket log channel set to ${channel}.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'transcript' || action === 'transcripts') {
      if (args[1] && (message.mentions.channels.first() || message.guild.channels.cache.get(args[1]))) {
        if (!message.member.permissions.has('ManageGuild')) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You need the **Manage Server** permission to set the transcript channel.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
        if (!channel) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Invalid channel. Mention a channel or provide its ID.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        await Ticket.findOneAndUpdate(
          { guildId: message.guild.id },
          { $set: { transcriptChannelId: channel.id, updatedAt: new Date() } },
          { upsert: true }
        );

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Transcript channel set to ${channel}.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const doc = await Ticket.findOne({ guildId: message.guild.id });
      const ticket = doc?.openTickets?.find(t => t.channelId === message.channel.id);
      if (!ticket) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.info} Ticket Transcripts\n\n` +
          `${blackEmoji.arrow} **Set channel:** \`${client.prefix}ticket transcript #channel\`\n` +
          `${blackEmoji.arrow} Use this command inside a ticket to save a transcript now.\n` +
          `${blackEmoji.arrow} Transcripts are automatically saved when tickets are closed.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading} Generating transcript...`));
      const loadMsg = await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });

      let allMessages = [];
      let lastId;
      while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;
        const batch = await message.channel.messages.fetch(options);
        if (batch.size === 0) break;
        allMessages.push(...batch.values());
        lastId = batch.last().id;
        if (batch.size < 100) break;
      }
      allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      const paddedNumber = String(ticket.ticketNumber).padStart(4, '0');
      const lines = [`=== Ticket #${paddedNumber} Transcript ===`, `Generated: ${new Date().toISOString()}`, '='.repeat(50), ''];
      for (const msg of allMessages) {
        const ts = msg.createdAt.toISOString().replace('T', ' ').slice(0, 19);
        const author = msg.author?.tag;
        let content = msg.content;
        if (msg.attachments.size > 0) content += ` [Attachments: ${msg.attachments.map(a => a.url).join(', ')}]`;
        if (content) lines.push(`[${ts}] ${author}: ${content}`);
      }

      const buffer = Buffer.from(lines.join('\n'), 'utf-8');

      if (doc.transcriptChannelId) {
        const tChannel = message.guild.channels.cache.get(doc.transcriptChannelId);
        if (tChannel) {
          await tChannel.send({ files: [{ attachment: buffer, name: `transcript-${paddedNumber}.txt` }] }).catch(() => {});
        }
      }

      const doneC = new ContainerBuilder();
      doneC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Transcript generated — **${allMessages.length}** messages saved.`));
      await loadMsg.edit({ components: [doneC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      return message.channel.send({ files: [{ attachment: buffer, name: `transcript-${paddedNumber}.txt` }] }).catch(() => {});
    }

    if (action === 'limit') {
      const limit = parseInt(args[1]);
      if (!args[1] || isNaN(limit) || limit < 1 || limit > 10) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.info} Max Tickets Per User\n\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}ticket limit <1-10>\`\n` +
          `${blackEmoji.arrow} Limits how many tickets a single user can have open at once.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Ticket.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { maxTicketsPerUser: limit, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Max tickets per user set to **${limit}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'addcategory') {
      const name = args[1];
      const emoji = args[2];
      const desc = args.slice(3).join(' ');

      if (!name) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.info} Add Ticket Category\n\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}ticket addcategory <name> [emoji] [description]\`\n` +
          `${blackEmoji.arrow} Categories appear as a dropdown when users create tickets.\n\n` +
          `**Example:**\n\`\`\`${client.prefix}ticket addcategory Support ${blackEmoji.tool} General support requests\`\`\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const doc = await Ticket.findOne({ guildId: message.guild.id });
      if (doc?.categories?.find(ct => ct.name.toLowerCase() === name.toLowerCase())) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} A category named **${name}** already exists.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (doc?.categories?.length >= 25) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Maximum of **25** categories allowed.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Ticket.findOneAndUpdate(
        { guildId: message.guild.id },
        { $push: { categories: { name, emoji, description: desc } }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Category Added`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Name:** ${name}\n` +
        `${blackEmoji.arrow} **Emoji:** ${emoji}${desc ? `\n${blackEmoji.arrow} **Description:** ${desc}` : ''}\n\n` +
        `${blackEmoji.info} Re-create the panel with \`${client.prefix}ticket panel\` to update it.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'removecategory') {
      const name = args.slice(1).join(' ');
      if (!name) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${client.prefix}ticket removecategory <name>\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const result = await Ticket.findOneAndUpdate(
        { guildId: message.guild.id },
        { $pull: { categories: { name } }, $set: { updatedAt: new Date() } }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Category **${name}** has been removed.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'categories') {
      const doc = await Ticket.findOne({ guildId: message.guild.id });
      const cats = doc?.categories || [];

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Ticket Categories`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      if (!cats.length) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No categories configured.\n` +
          `${blackEmoji.arrow} Add one with \`${client.prefix}ticket addcategory <name> [emoji] [description]\`\n\n` +
          `${blackEmoji.info} Without categories, tickets are created directly.\n` +
          `${blackEmoji.info} With categories, users see a dropdown to choose a type.`
        ));
      } else {
        const catList = cats.map((ct, i) => `\`${i + 1}.\` ${ct.emoji} **${ct.name}**${ct.description ? ` — ${ct.description}` : ''}`).join('\n');
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(catList));
        c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} ${cats.length}/25 categories`));
      }

      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'clearcategories') {
      await Ticket.findOneAndUpdate({ guildId: message.guild.id }, { $set: { categories: [], updatedAt: new Date() } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} All ticket categories have been cleared.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'adduser') {
      const user = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      if (!user) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}ticket adduser @user\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const doc = await Ticket.findOne({ guildId: message.guild.id });
      const ticket = doc?.openTickets?.find(t => t.channelId === message.channel.id);
      if (!ticket) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This command can only be used inside a ticket channel.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await message.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true
      });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${user} has been added to this ticket.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'removeuser') {
      const user = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      if (!user) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}ticket removeuser @user\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const doc = await Ticket.findOne({ guildId: message.guild.id });
      const ticket = doc?.openTickets?.find(t => t.channelId === message.channel.id);
      if (!ticket) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This command can only be used inside a ticket channel.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (user.id === ticket.userId) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You cannot remove the ticket owner.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await message.channel.permissionOverwrites.edit(user.id, { ViewChannel: false, SendMessages: false });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} ${user} has been removed from this ticket.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'close') {
      const doc = await Ticket.findOne({ guildId: message.guild.id });
      const ticket = doc?.openTickets?.find(t => t.channelId === message.channel.id);
      if (!ticket) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This is not an active ticket channel.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
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
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'claim') {
      const doc = await Ticket.findOne({ guildId: message.guild.id });
      const ticket = doc?.openTickets?.find(t => t.channelId === message.channel.id);
      if (!ticket) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This is not an active ticket channel.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const isStaff = doc.staffRoleId && message.member.roles.cache.has(doc.staffRoleId);
      const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.ManageGuild);
      if (!isStaff && !isAdmin) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Only staff members can claim tickets.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (ticket.claimedBy) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This ticket is already claimed by <@${ticket.claimedBy}>.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      ticket.claimedBy = message.author.id;
      doc.updatedAt = new Date();
      await doc.save();

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Ticket Claimed`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **Handler:** ${message.author}\n` +
        `${blackEmoji.arrow} You are now handling this ticket.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'rename') {
      const doc = await Ticket.findOne({ guildId: message.guild.id });
      const ticket = doc?.openTickets?.find(t => t.channelId === message.channel.id);
      if (!ticket) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This is not an active ticket channel.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const newName = args.slice(1).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!newName) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}ticket rename <new-name>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await message.channel.setName(newName).catch(() => {});
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Ticket renamed to **${newName}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'topic') {
      const doc = await Ticket.findOne({ guildId: message.guild.id });
      const ticket = doc?.openTickets?.find(t => t.channelId === message.channel.id);
      if (!ticket) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This is not an active ticket channel.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const newTopic = args.slice(1).join(' ');
      if (!newTopic) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}ticket topic <text>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      ticket.topic = newTopic;
      doc.updatedAt = new Date();
      await doc.save();

      await message.channel.setTopic(`Ticket #${String(ticket.ticketNumber).padStart(4, '0')} | <@${ticket.userId}> | ${ticket.category} | ${newTopic}`).catch(() => {});

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Ticket topic updated to: **${newTopic}**`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'name' || action === 'format') {
      const format = args.slice(1).join(' ');
      if (!format) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.info} Ticket Name Format\n\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}ticket name <format>\`\n` +
          `${blackEmoji.arrow} **Variables:** \`{number}\` \`{username}\`\n\n` +
          `**Examples:**\n` +
          `\`ticket-{number}\` → \`ticket-0001\`\n` +
          `\`{username}-{number}\` → \`john-0001\`\n` +
          `\`support-{number}\` → \`support-0001\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await Ticket.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { ticketNameFormat: format, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Ticket name format set to \`${format}\``));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'config') {
      const doc = await Ticket.findOne({ guildId: message.guild.id });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Ticket Configuration`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Status:** ${doc?.enabled ? `${blackEmoji.on} Enabled` : `${blackEmoji.off} Disabled`}\n` +
        `${blackEmoji.arrow} **Staff Role:** ${doc?.staffRoleId ? `<@&${doc.staffRoleId}>` : '`Not set`'}\n` +
        `${blackEmoji.arrow} **Category:** ${doc?.categoryId ? `<#${doc.categoryId}>` : '`Not set`'}\n` +
        `${blackEmoji.arrow} **Log Channel:** ${doc?.logChannelId ? `<#${doc.logChannelId}>` : '`Not set`'}\n` +
        `${blackEmoji.arrow} **Transcript Channel:** ${doc?.transcriptChannelId ? `<#${doc.transcriptChannelId}>` : '`Not set`'}\n` +
        `${blackEmoji.arrow} **Max Per User:** ${doc?.maxTicketsPerUser || 1}\n` +
        `${blackEmoji.arrow} **Name Format:** \`${doc?.ticketNameFormat}\`\n` +
        `${blackEmoji.arrow} **Categories:** ${doc?.categories?.length || 0}\n` +
        `${blackEmoji.arrow} **Open Tickets:** ${doc?.openTickets?.length || 0}\n` +
        `${blackEmoji.arrow} **Total Created:** ${doc?.ticketCount || 0}`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**Panel:**\n` +
        `${blackEmoji.arrow} **Title:** ${doc?.panelTitle}\n` +
        `${blackEmoji.arrow} **Button:** ${doc?.panelButtonEmoji} ${doc?.panelButtonLabel} (${doc?.panelButtonColor})`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'paneltitle') {
      const title = args.slice(1).join(' ');
      if (!title) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}ticket paneltitle <text>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Ticket.findOneAndUpdate({ guildId: message.guild.id }, { $set: { panelTitle: title, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Panel title set to **${title}**. Re-create the panel to apply.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'paneldesc') {
      const desc = args.slice(1).join(' ');
      if (!desc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}ticket paneldesc <text>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Ticket.findOneAndUpdate({ guildId: message.guild.id }, { $set: { panelDescription: desc, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Panel description updated. Re-create the panel to apply.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'buttonlabel') {
      const label = args.slice(1).join(' ');
      if (!label) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}ticket buttonlabel <text>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Ticket.findOneAndUpdate({ guildId: message.guild.id }, { $set: { panelButtonLabel: label, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Button label set to **${label}**. Re-create the panel to apply.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'buttoncolor') {
      const color = args[1];
      const validColors = ['Primary', 'Secondary', 'Success', 'Danger'];
      const matched = validColors.find(c => c.toLowerCase() === color?.toLowerCase());
      if (!matched) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.info} **Usage:** \`${client.prefix}ticket buttoncolor <Primary|Secondary|Success|Danger>\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Ticket.findOneAndUpdate({ guildId: message.guild.id }, { $set: { panelButtonColor: matched, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Button color set to **${matched}**. Re-create the panel to apply.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'buttonemoji') {
      const emoji = args[1];
      if (!emoji) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}ticket buttonemoji <emoji>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await Ticket.findOneAndUpdate({ guildId: message.guild.id }, { $set: { panelButtonEmoji: emoji, updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Button emoji set to ${emoji}. Re-create the panel to apply.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'reset') {
      const doc = await Ticket.findOne({ guildId: message.guild.id });
      const openCount = doc?.openTickets?.length || 0;

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Reset Ticket System`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} This will delete all ticket configuration.\n` +
        `${openCount > 0 ? `${blackEmoji.warn} **${openCount}** ticket(s) are still open.\n` : ''}` +
        `${blackEmoji.danger} **This cannot be undone!**`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_reset_confirm').setLabel('Reset Everything').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ticket_reset_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        )
      );

      const confirmMsg = await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });

      const interaction = await confirmMsg.awaitMessageComponent({
        filter: (i) => i.user.id === message.author.id,
        time: 15000,
        componentType: ComponentType.Button,
      }).catch(() => null);

      if (!interaction || interaction.customId === 'ticket_reset_cancel') {
        const cancelC = new ContainerBuilder();
        cancelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Reset cancelled.`));
        if (interaction) {
          await interaction.update({ components: [cancelC], flags: MessageFlags.IsComponentsV2 });
        } else {
          await confirmMsg.edit({ components: [cancelC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
        return;
      }

      await Ticket.deleteOne({ guildId: message.guild.id });

      const successC = new ContainerBuilder();
      successC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Ticket system has been completely reset.`));
      await interaction.update({ components: [successC], flags: MessageFlags.IsComponentsV2 });
      return;
    }

    if (action === 'disable') {
      await Ticket.findOneAndUpdate({ guildId: message.guild.id }, { $set: { enabled: false, updatedAt: new Date() } });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Ticket system has been **disabled**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.channel} Ticket System`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Setup**\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket setup\` — Enable ticket system\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket staff @role\` — Set support role\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket category <id>\` — Set ticket category channel\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket log #channel\` — Set log channel\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket transcript #channel\` — Set transcript channel\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket limit <1-10>\` — Max tickets per user\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket panel\` — Create ticket panel`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Categories**\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket addcategory <name> [emoji] [desc]\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket removecategory <name>\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket categories\` — List categories\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket clearcategories\``
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Panel Customization**\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket paneltitle <text>\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket paneldesc <text>\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket buttonlabel <text>\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket buttoncolor <color>\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket buttonemoji <emoji>\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket name <format>\` — Channel name format`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**In-Ticket**\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket claim\` — Claim a ticket\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket close\` — Close ticket\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket adduser @user\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket removeuser @user\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket rename <name>\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket topic <text>\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket transcript\` — Save transcript`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**System**\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket config\` — View config\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket disable\` — Disable system\n` +
      `${blackEmoji.arrow} \`${client.prefix}ticket reset\` — Reset everything`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
