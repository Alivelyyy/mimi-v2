const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const ReactionRole = require('@db/reactionRoles.js');

module.exports = {
  name: 'reactionrole',
  aliases: ['rr', 'reactrole'],
  cooldown: '3',
  category: 'reactionroles',
  usage: '<add|remove|list|clear>',
  description: 'Manage reaction roles for your server',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ['ManageRoles', 'AddReactions'],
  userPerms: ['ManageRoles'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const action = args[0]?.toLowerCase();

    if (action === 'add') {
      const channelId = args[1]?.replace(/[<#>]/g, '');
      const messageId = args[2];
      const emoji = args[3];
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[4]);

      if (!channelId || !messageId || !emoji || !role) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Reaction Role — Add`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}rr add #channel <messageId> <emoji> @role\`\n\n` +
          `**Example:**\n\`\`\`${client.prefix}rr add #roles 123456789 ${blackEmoji.checkReact} @Member\`\`\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const channel = message.guild.channels.cache.get(channelId);
      if (!channel) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Channel \`${channelId}\` not found in this server.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (role.managed || role.id === message.guild.id) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Cannot use managed roles or @everyone as a reaction role.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const botMember = message.guild.members.cache.get(client.user.id);
      if (botMember && role.position >= botMember.roles.highest.position) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} The role ${role} is higher than my highest role. I can't assign it.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const msg = await channel.messages.fetch(messageId).catch(() => null);
      if (!msg) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Message \`${messageId}\` not found in ${channel}.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const existing = await ReactionRole.findOne({
        guildId: message.guild.id,
        messageId,
        emoji
      });

      if (existing) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} That emoji is already assigned to <@&${existing.roleId}> on that message.\n` +
          `${blackEmoji.arrow} Remove it first with \`${client.prefix}rr remove ${messageId} ${emoji}\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const reacted = await msg.react(emoji).catch(() => null);
      if (!reacted) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to react with that emoji. Make sure it's a valid emoji I can use.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await ReactionRole.create({
        guildId: message.guild.id,
        channelId,
        messageId,
        emoji,
        roleId: role.id
      });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Reaction Role Added`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Channel:** ${channel}\n` +
        `${blackEmoji.arrow} **Message:** [Jump to message](https://discord.com/channels/${message.guild.id}/${channelId}/${messageId})\n` +
        `${blackEmoji.arrow} **Emoji:** ${emoji}\n` +
        `${blackEmoji.arrow} **Role:** ${role}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'remove') {
      const messageId = args[1];
      const emoji = args[2];

      if (!messageId) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Reaction Role — Remove`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Remove specific:** \`${client.prefix}rr remove <messageId> <emoji>\`\n` +
          `${blackEmoji.arrow} **Remove all from message:** \`${client.prefix}rr remove <messageId>\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (emoji) {
        const doc = await ReactionRole.findOneAndDelete({
          guildId: message.guild.id,
          messageId,
          emoji
        });

        if (!doc) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No reaction role found for ${emoji} on message \`${messageId}\`.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Reaction Role Removed`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Emoji:** ${emoji}\n` +
          `${blackEmoji.arrow} **Role:** <@&${doc.roleId}>\n` +
          `${blackEmoji.arrow} **Message:** \`${messageId}\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const count = await ReactionRole.countDocuments({ guildId: message.guild.id, messageId });
      if (count === 0) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No reaction roles found on message \`${messageId}\`.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await ReactionRole.deleteMany({ guildId: message.guild.id, messageId });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Reaction Roles Removed`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Removed **${count}** reaction role(s) from message \`${messageId}\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'list') {
      const docs = await ReactionRole.find({ guildId: message.guild.id }).sort({ createdAt: -1 });

      if (!docs.length) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Reaction Roles`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} No reaction roles configured\n` +
          `${blackEmoji.arrow} Add one with \`${client.prefix}rr add #channel <msgId> <emoji> @role\``
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const grouped = {};
      for (const doc of docs) {
        const key = `${doc.channelId}-${doc.messageId}`;
        if (!grouped[key]) grouped[key] = { channelId: doc.channelId, messageId: doc.messageId, entries: [] };
        grouped[key].entries.push(doc);
      }

      const groups = Object.values(grouped);
      let listText = '';

      groups.forEach((group, i) => {
        const jumpLink = `https://discord.com/channels/${message.guild.id}/${group.channelId}/${group.messageId}`;
        listText += `**${i + 1}. <#${group.channelId}>** — [Message](${jumpLink})\n`;
        group.entries.forEach(entry => {
          listText += `   ${blackEmoji.arrow} ${entry.emoji} → <@&${entry.roleId}>\n`;
        });
        if (i < groups.length - 1) listText += '\n';
      });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Reaction Roles`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(listText));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.info} **Total:** ${docs.length} reaction role(s) across ${groups.length} message(s)`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (action === 'clear' || action === 'reset') {
      const count = await ReactionRole.countDocuments({ guildId: message.guild.id });

      if (count === 0) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No reaction roles to clear.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Clear All Reaction Roles`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} This will remove **${count}** reaction role(s)\n` +
        `${blackEmoji.danger} **This cannot be undone!**`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("confirm_rr_clear").setLabel("Clear All").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId("cancel_rr_clear").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
        )
      );

      const confirmMsg = await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });

      const interaction = await confirmMsg.awaitMessageComponent({
        filter: (i) => i.user.id === message.author.id,
        time: 15000,
        componentType: ComponentType.Button,
      }).catch(() => null);

      if (!interaction || interaction.customId === "cancel_rr_clear") {
        const cancelC = new ContainerBuilder();
        cancelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Reaction role clear cancelled.`));
        if (interaction) {
          await interaction.update({ components: [cancelC], flags: MessageFlags.IsComponentsV2 });
        } else {
          await confirmMsg.edit({ components: [cancelC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
        return;
      }

      await ReactionRole.deleteMany({ guildId: message.guild.id });

      const successC = new ContainerBuilder();
      successC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Reaction Roles Cleared`));
      successC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      successC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Removed **${count}** reaction role(s) from this server`
      ));
      await interaction.update({ components: [successC], flags: MessageFlags.IsComponentsV2 });
      return;
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Reaction Roles`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.arrow} \`${client.prefix}rr add #channel <msgId> <emoji> @role\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}rr remove <msgId> [emoji]\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}rr list\`\n` +
      `${blackEmoji.arrow} \`${client.prefix}rr clear\``
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} React with an emoji on a message to give/remove roles automatically`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
