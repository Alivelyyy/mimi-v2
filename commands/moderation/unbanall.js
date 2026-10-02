const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'unbanall',
  aliases: ['uba', 'unbaneveryone'],
  cooldown: '',
  category: 'moderation',
  usage: '',
  description: 'Unban all banned users',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['BanMembers'], userPerms: ['BanMembers'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message) => {
    const bans = await message.guild.bans.fetch();

    if (bans.size === 0) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} No banned users found.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const confirmContainer = new ContainerBuilder();
    confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Confirm Unban All`));
    confirmContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `This will unban **${bans.size}** user${bans.size !== 1 ? 's' : ''}.\nThis action cannot be undone.`
    ));
    confirmContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    confirmContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_unbanall').setLabel(`Unban ${bans.size} Users`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancel_unbanall').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
      )
    );

    const m = await message.reply({ components: [confirmContainer], flags: MessageFlags.IsComponentsV2 });

    let interaction;
    try {
      interaction = await m.awaitMessageComponent({ filter: i => i.user.id === message.author.id && ['confirm_unbanall', 'cancel_unbanall'].includes(i.customId), time: 30000 });
    } catch {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.cool} Timed out.`));
      return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    await interaction.deferUpdate().catch(() => {});

    if (interaction.customId === 'cancel_unbanall') {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Cancelled.`));
      return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    const loadC = new ContainerBuilder();
    loadC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading} Unbanning **${bans.size}** users...`));
    await m.edit({ components: [loadC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    let count = 0;
    for (const [, ban] of bans) {
      await message.guild.members.unban(ban.user.id, 'Unban all').catch(() => {});
      count++;
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Unban All Complete`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.yes} Successfully unbanned **${count}** user${count !== 1 ? 's' : ''}.\n` +
      `${blackEmoji.mod} **Moderator:** ${message.author.tag}`
    ));
    return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  }
};
