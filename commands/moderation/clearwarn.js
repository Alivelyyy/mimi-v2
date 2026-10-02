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
const ModWarn = require('@db/modWarn.js');

module.exports = {
  name: 'clearwarn',
  aliases: ['cw', 'clearwarns'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user> [warnId|all]',
  description: 'Clear a specific warning or all warnings for a member',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: ['ModerateMembers'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!target) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid member.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const warnIdArg = args[1];

    if (!warnIdArg) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Usage: \`${client.prefix}clearwarn @user <warnId|all>\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      const doc = await ModWarn.findOne({ guildId: message.guild.id, userId: target.id });

      if (!doc || doc.warnings.length === 0) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} **${target.user.tag}** has no warnings.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (warnIdArg.toLowerCase() === 'all') {
        const confirmContainer = new ContainerBuilder();
        confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Clear All Warnings?`));
        confirmContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `This will remove **all ${doc.warnings.length} warnings** from **${target.user.tag}**.\nThis action cannot be undone.`
        ));
        confirmContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        confirmContainer.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm').setLabel('Clear All').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
          )
        );

        const m = await message.reply({ components: [confirmContainer], flags: MessageFlags.IsComponentsV2 });

        let interaction;
        try {
          interaction = await m.awaitMessageComponent({ filter: i => i.user.id === message.author.id, time: 30000 });
        } catch {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.cool} Timed out.`));
          return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }

        await interaction.deferUpdate().catch(() => {});

        if (interaction.customId === 'cancel') {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Cancelled.`));
          return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }

        await ModWarn.findOneAndUpdate(
          { guildId: message.guild.id, userId: target.id },
          { $set: { warnings: [] } }
        );

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Cleared all warnings for **${target.user.tag}**.`));
        return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      const warnIndex = doc.warnings.findIndex(w => w.warnId === warnIdArg.toUpperCase());
      if (warnIndex === -1) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Warning ID \`${warnIdArg}\` not found for this user.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      doc.warnings.splice(warnIndex, 1);
      await doc.save();

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Removed warning \`${warnIdArg.toUpperCase()}\` from **${target.user.tag}**.\n` +
        `Remaining warnings: **${doc.warnings.length}**`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
