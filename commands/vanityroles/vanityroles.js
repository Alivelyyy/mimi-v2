const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const VanityRoles = require('@db/vanityRoles.js');

module.exports = {
  name: 'vanityroles',
  aliases: ['vr', 'vanity'],
  cooldown: '3',
  category: 'vanityroles',
  usage: '<setup|role|channel|add|remove|message|list|enable|disable|config|reset>',
  description: 'Vanity role system — auto-assign roles to users who rep your server vanity in their status',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageRoles'],
  userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,

  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();

    if (action === 'setup') {
      const vanityUrl = args[1];
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

      if (!vanityUrl || !role) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.info} Vanity Roles Setup\n\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}vr setup <vanityText> @role\`\n\n` +
          `**Example:**\n\`${client.prefix}vr setup discord.gg/myserver @Repper\`\n\n` +
          `${blackEmoji.info} Users with this text in their **status** or **custom status** will automatically receive the role.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (role.managed) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Cannot use a managed/bot role.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const botMember = message.guild.members.me;
      if (botMember.roles.highest.position <= role.position) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} My highest role must be above ${role} to assign it.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const cleanUrl = vanityUrl.replace(/^(https?:\/\/)?(www\.)?/i, '').toLowerCase();

      await VanityRoles.findOneAndUpdate(
        { guildId: message.guild.id },
        {
          $set: { enabled: true, roleId: role.id, updatedAt: new Date() },
          $addToSet: { vanityUrls: cleanUrl }
        },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Vanity Roles Enabled`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Vanity:** \`${cleanUrl}\`\n` +
        `${blackEmoji.arrow} **Role:** ${role}\n\n` +
        `${blackEmoji.info} Users with \`${cleanUrl}\` in their status will get ${role} automatically.\n` +
        `${blackEmoji.arrow} Set a notification channel: \`${client.prefix}vr channel #channel\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'role') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (!role) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}vr role @role\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (role.managed) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Cannot use a managed/bot role.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const botMember = message.guild.members.me;
      if (botMember.roles.highest.position <= role.position) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} My highest role must be above ${role} to assign it.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await VanityRoles.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { roleId: role.id, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Vanity role set to ${role}.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'channel') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}vr channel #channel\`\n${blackEmoji.arrow} Notifications will be sent here when users add/remove vanity.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await VanityRoles.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { channelId: channel.id, updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Vanity notification channel set to ${channel}.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'add') {
      const vanityUrl = args[1];
      if (!vanityUrl) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}vr add <vanityText>\`\n${blackEmoji.arrow} Add another vanity URL/text to track.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const cleanUrl = vanityUrl.replace(/^(https?:\/\/)?(www\.)?/i, '').toLowerCase();
      const doc = await VanityRoles.findOne({ guildId: message.guild.id });

      if (doc?.vanityUrls?.includes(cleanUrl)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} \`${cleanUrl}\` is already being tracked.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (doc?.vanityUrls?.length >= 10) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Maximum of **10** vanity URLs allowed.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await VanityRoles.findOneAndUpdate(
        { guildId: message.guild.id },
        { $addToSet: { vanityUrls: cleanUrl }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Added \`${cleanUrl}\` to tracked vanity URLs.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'remove') {
      const vanityUrl = args[1];
      if (!vanityUrl) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}vr remove <vanityText>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const cleanUrl = vanityUrl.replace(/^(https?:\/\/)?(www\.)?/i, '').toLowerCase();
      await VanityRoles.findOneAndUpdate(
        { guildId: message.guild.id },
        { $pull: { vanityUrls: cleanUrl }, $set: { updatedAt: new Date() } }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Removed \`${cleanUrl}\` from tracked vanity URLs.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'message') {
      const sub = args[1]?.toLowerCase();

      if (sub === 'welcome') {
        const msg = args.slice(2).join(' ');
        if (!msg) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${blackEmoji.info} Welcome Message\n\n` +
            `${blackEmoji.arrow} **Usage:** \`${client.prefix}vr message welcome <text>\`\n\n` +
            `**Variables:**\n` +
            `\`{user}\` — User mention\n` +
            `\`{username}\` — Username\n` +
            `\`{server}\` — Server name\n` +
            `\`{role}\` — Role mention`
          ));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        await VanityRoles.findOneAndUpdate(
          { guildId: message.guild.id },
          { $set: { welcomeMessage: msg, updatedAt: new Date() } },
          { upsert: true }
        );

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Welcome message updated.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (sub === 'remove') {
        const msg = args.slice(2).join(' ');
        if (!msg) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${blackEmoji.info} Remove Message\n\n` +
            `${blackEmoji.arrow} **Usage:** \`${client.prefix}vr message remove <text>\`\n\n` +
            `**Variables:** \`{user}\`, \`{username}\`, \`{server}\`, \`{role}\``
          ));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        await VanityRoles.findOneAndUpdate(
          { guildId: message.guild.id },
          { $set: { removeMessage: msg, updatedAt: new Date() } },
          { upsert: true }
        );

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Remove message updated.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.info} **Usage:**\n` +
        `${blackEmoji.arrow} \`${client.prefix}vr message welcome <text>\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}vr message remove <text>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'list') {
      const doc = await VanityRoles.findOne({ guildId: message.guild.id });
      const urls = doc?.vanityUrls || [];

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Tracked Vanity URLs`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      if (!urls.length) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No vanity URLs configured.\n${blackEmoji.arrow} Add one: \`${client.prefix}vr setup <url> @role\``
        ));
      } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          urls.map((url, i) => `\`${i + 1}.\` \`${url}\``).join('\n') +
          `\n\n${blackEmoji.info} **Repping users:** ${doc?.trackedUsers?.length || 0}`
        ));
      }

      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'enable') {
      const doc = await VanityRoles.findOne({ guildId: message.guild.id });
      if (!doc?.vanityUrls?.length || !doc?.roleId) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Set up vanity roles first with \`${client.prefix}vr setup <url> @role\`.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      doc.enabled = true;
      doc.updatedAt = new Date();
      await doc.save();

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Vanity role system **enabled**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'disable') {
      await VanityRoles.findOneAndUpdate(
        { guildId: message.guild.id },
        { $set: { enabled: false, updatedAt: new Date() } }
      );

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Vanity role system **disabled**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'config') {
      const doc = await VanityRoles.findOne({ guildId: message.guild.id });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Vanity Roles Configuration`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Status:** ${doc?.enabled ? `${blackEmoji.on} Enabled` : `${blackEmoji.off} Disabled`}\n` +
        `${blackEmoji.arrow} **Role:** ${doc?.roleId ? `<@&${doc.roleId}>` : '`Not set`'}\n` +
        `${blackEmoji.arrow} **Notification Channel:** ${doc?.channelId ? `<#${doc.channelId}>` : '`Not set`'}\n` +
        `${blackEmoji.arrow} **Tracked URLs:** ${doc?.vanityUrls?.length || 0}\n` +
        `${blackEmoji.arrow} **Active Reppers:** ${doc?.trackedUsers?.length || 0}`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**Messages:**\n` +
        `${blackEmoji.arrow} **Welcome:** ${doc?.welcomeMessage}\n` +
        `${blackEmoji.arrow} **Remove:** ${doc?.removeMessage}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'reset') {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Reset Vanity Roles`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} This will delete all vanity role configuration.\n` +
        `${blackEmoji.danger} **This cannot be undone!**`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('vr_reset_confirm').setLabel('Reset Everything').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('vr_reset_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        )
      );

      const confirmMsg = await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });

      const interaction = await confirmMsg.awaitMessageComponent({
        filter: (i) => i.user.id === message.author.id,
        time: 15000,
        componentType: ComponentType.Button,
      }).catch(() => null);

      if (!interaction || interaction.customId === 'vr_reset_cancel') {
        const cancelC = new ContainerBuilder();
        cancelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Reset cancelled.`));
        if (interaction) {
          await interaction.update({ components: [cancelC], flags: MessageFlags.IsComponentsV2 });
        } else {
          await confirmMsg.edit({ components: [cancelC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
        return;
      }

      await VanityRoles.deleteOne({ guildId: message.guild.id });

      const successC = new ContainerBuilder();
      successC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Vanity role system has been completely reset.`));
      await interaction.update({ components: [successC], flags: MessageFlags.IsComponentsV2 });
      return;
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Vanity Roles`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `Auto-assign a role to users who have your server's vanity URL in their status.\n\n` +
      `**Setup**\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr setup <url> @role\` — Quick setup\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr role @role\` — Change reward role\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr channel #channel\` — Notification channel`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Vanity URLs**\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr add <url>\` — Add another URL to track\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr remove <url>\` — Remove a URL\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr list\` — List all tracked URLs`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Messages**\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr message welcome <text>\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr message remove <text>\`\n\n` +
      `**System**\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr enable\` / \`${client.prefix}vr disable\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr config\` — View config\n` +
      `${blackEmoji.arrow} \`${client.prefix}vr reset\` — Reset everything`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
