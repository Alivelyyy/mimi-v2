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
  name: 'ban',
  aliases: ['b', 'banish'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user> [reason]',
  description: 'Ban a member from the server',
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
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!target) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid member to ban.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (target.id === message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You cannot ban yourself.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (target.id === client.user.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} I cannot ban myself.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (!target.bannable) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} I cannot ban **${target.user.tag}** — they may have a higher role than me.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (message.member.roles.highest.comparePositionTo(target.roles.highest) <= 0 && message.guild.ownerId !== message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You cannot ban someone with an equal or higher role than you.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const reason = args.slice(1).join(' ');

    const confirmContainer = new ContainerBuilder();
    confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Confirm Ban`));
    confirmContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.user} **User:** ${target.user.tag} (\`${target.id}\`)\n` +
      `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
      `${blackEmoji.info} **Reason:** ${reason}`
    ));
    confirmContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    confirmContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_ban').setLabel('Confirm Ban').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancel_ban').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
      )
    );

    const m = await message.reply({ components: [confirmContainer], flags: MessageFlags.IsComponentsV2 });

    const filter = i => i.user.id === message.author.id && ['confirm_ban', 'cancel_ban'].includes(i.customId);
    let interaction;
    try {
      interaction = await m.awaitMessageComponent({ filter, time: 30000 });
    } catch {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.cool} Ban cancelled — timed out.`));
      return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    await interaction.deferUpdate().catch(() => {});

    if (interaction.customId === 'cancel_ban') {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Ban cancelled.`));
      return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    try {
      await target.send({
        components: [(() => {
          const dc = new ContainerBuilder();
          dc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${blackEmoji.warn} You have been banned\n` +
            `**Server:** ${message.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
          ));
          return dc;
        })()],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});

      await target.ban({ reason: `${message.author.tag}: ${reason}` });

      const caseId = await logModAction(message.guild, 'ban', {
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason
      });

      const successContainer = new ContainerBuilder();
      successContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} User Banned`));
      successContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      successContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${target.user.tag} (\`${target.id}\`)\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}\n` +
        `${blackEmoji.list} **Case:** #${caseId}`
      ));
      await m.edit({ components: [successContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to ban: ${err.message}`));
      m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  }
};
