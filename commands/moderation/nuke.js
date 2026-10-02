const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { logModAction } = require('@utils/modLogger.js');

module.exports = {
  name: 'nuke',
  aliases: ['nc', 'nukechannel'],
  cooldown: '',
  category: 'moderation',
  usage: '',
  description: 'Nuke (clone and delete) the current channel',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageChannels'], userPerms: ['ManageChannels'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message) => {
    const confirmContainer = new ContainerBuilder();
    confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Confirm Nuke`));
    confirmContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.channel} **Channel:** ${message.channel}\n` +
      `${blackEmoji.info} This will **clone** and **delete** this channel.\nAll messages will be permanently lost.`
    ));
    confirmContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    confirmContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_nuke').setLabel('Confirm Nuke').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancel_nuke').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
      )
    );

    const m = await message.reply({ components: [confirmContainer], flags: MessageFlags.IsComponentsV2 });

    const filter = i => i.user.id === message.author.id && ['confirm_nuke', 'cancel_nuke'].includes(i.customId);
    let interaction;
    try {
      interaction = await m.awaitMessageComponent({ filter, time: 15000 });
    } catch {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.cool} Nuke cancelled — timed out.`));
      return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    await interaction.deferUpdate().catch(() => {});

    if (interaction.customId === 'cancel_nuke') {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Nuke cancelled.`));
      return m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    try {
      const channelName = message.channel.name;
      const newChannel = await message.channel.clone({ reason: `Nuked by ${message.author.tag}` });
      await newChannel.setPosition(message.channel.position);
      await message.channel.delete('Channel nuked');

      await logModAction(newChannel.guild, 'nuke', {
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason: `Nuked #${channelName}`,
        extra: `**New Channel:** <#${newChannel.id}>`
      });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Channel Nuked`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.channel} Channel has been **nuked** and recreated.\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}`
      ));
      newChannel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to nuke: ${err.message}`));
      m.edit({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  }
};
