const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { logModAction } = require('@utils/modLogger.js');

module.exports = {
  name: 'massban',
  aliases: ['mb', 'mban'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user1 @user2 ...> [--reason text]',
  description: 'Ban multiple users at once (useful for raids)',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ['BanMembers'],
  userPerms: ['BanMembers'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const reasonIndex = args.indexOf('--reason');
    let reason = 'Mass ban';
    let userArgs = args;

    if (reasonIndex !== -1) {
      reason = args.slice(reasonIndex + 1).join(' ');
      userArgs = args.slice(0, reasonIndex);
    }

    const userIds = new Set();
    for (const arg of userArgs) {
      const id = arg.replace(/[<@!>]/g, '');
      if (/^\d{17,20}$/.test(id)) {
        userIds.add(id);
      }
    }

    if (userIds.size === 0) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.info} Mass Ban\n\n` +
        `${blackEmoji.arrow} \`${client.prefix}massban @user1 @user2 @user3 --reason Raiding\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}massban 123456 789012 --reason Spam bots\`\n\n` +
        `You can mention users or provide user IDs.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    userIds.delete(message.author.id);
    userIds.delete(client.user.id);
    userIds.delete(message.guild.ownerId);

    if (userIds.size === 0) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No valid users to ban.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const confirmContainer = new ContainerBuilder();
    confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Confirm Mass Ban`));
    confirmContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.user} **Users:** ${userIds.size} member${userIds.size !== 1 ? 's' : ''}\n` +
      `${blackEmoji.info} **Reason:** ${reason}\n\n` +
      `This action **cannot** be undone easily.`
    ));
    confirmContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    confirmContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_massban').setLabel(`Ban ${userIds.size} Users`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancel_massban').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
      )
    );

    const m = await message.reply({ components: [confirmContainer], flags: MessageFlags.IsComponentsV2 });

    const filter = i => i.user.id === message.author.id && ['confirm_massban', 'cancel_massban'].includes(i.customId);
    let interaction;
    try {
      interaction = await m.awaitMessageComponent({ filter, time: 30000 });
    } catch {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.cool} Mass ban cancelled — timed out.`));
      return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    await interaction.deferUpdate().catch(() => {});

    if (interaction.customId === 'cancel_massban') {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Mass ban cancelled.`));
      return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    let banned = 0;
    let failed = 0;
    const bannedUsers = [];

    for (const userId of userIds) {
      try {
        await message.guild.members.ban(userId, { reason: `Mass ban by ${message.author.tag}: ${reason}`, deleteMessageSeconds: 604800 });
        banned++;
        const user = await client.users.fetch(userId).catch(() => null);
        bannedUsers.push(user?.tag || userId);
      } catch {
        failed++;
      }
    }

    const caseId = await logModAction(message.guild, 'massban', {
      moderatorId: message.author.id,
      moderatorTag: message.author.tag,
      reason,
      extra: `**Banned:** ${banned} \u2022 **Failed:** ${failed}`
    });

    const successContainer = new ContainerBuilder();
    successContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Mass Ban Complete`));
    successContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    successContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.yes} **Banned:** ${banned}\n` +
      (failed > 0 ? `${blackEmoji.no} **Failed:** ${failed}\n` : '') +
      `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
      `${blackEmoji.info} **Reason:** ${reason}\n` +
      `${blackEmoji.list} **Case:** #${caseId}`
    ));

    if (bannedUsers.length > 0 && bannedUsers.length <= 15) {
      successContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      successContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**Banned Users:**\n${bannedUsers.map(u => `${blackEmoji.arrow} ${u}`).join('\n')}`
      ));
    }

    await m.edit({ components: [successContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  }
};
