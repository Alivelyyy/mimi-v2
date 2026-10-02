const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

function buildJ2CPanel(channel, owner, j2cDoc) {
  const lockStatus = j2cDoc.locked ? '🔒 Locked' : '🔓 Unlocked';
  const hideStatus = j2cDoc.hidden ? '👻 Hidden' : '👁️ Visible';

  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## ${blackEmoji.mic || '🎙️'} ${channel.name}\n` +
    `**Owner:** <@${owner.id}>\n\n` +
    `**Channel Settings**\n` +
    `> ${blackEmoji.arrow} **Status:** ${lockStatus}\n` +
    `> ${blackEmoji.arrow} **Visibility:** ${hideStatus}\n` +
    `> ${blackEmoji.arrow} **User Limit:** \`${channel.userLimit || 'No limit'}\`\n` +
    `> ${blackEmoji.arrow} **Bitrate:** \`${Math.floor(channel.bitrate / 1000)}kbps\`\n\n` +
    `Use the buttons below to manage your voice channel.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('j2c:lock')
        .setEmoji(j2cDoc.locked ? '🔓' : '🔒')
        .setLabel(j2cDoc.locked ? 'Unlock' : 'Lock')
        .setStyle(j2cDoc.locked ? ButtonStyle.Success : ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('j2c:hide')
        .setEmoji(j2cDoc.hidden ? '👁️' : '👻')
        .setLabel(j2cDoc.hidden ? 'Unhide' : 'Hide')
        .setStyle(j2cDoc.hidden ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('j2c:rename')
        .setEmoji('✏️')
        .setLabel('Rename')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('j2c:limit')
        .setEmoji('👥')
        .setLabel('Limit')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('j2c:bitrate')
        .setEmoji('🎵')
        .setLabel('Bitrate')
        .setStyle(ButtonStyle.Primary)
    )
  );
  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('j2c:claim')
        .setEmoji('👑')
        .setLabel('Claim')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('j2c:transfer')
        .setEmoji('🔄')
        .setLabel('Transfer')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('j2c:permit')
        .setEmoji('✅')
        .setLabel('Permit')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('j2c:reject')
        .setEmoji('❌')
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('j2c:info')
        .setEmoji('ℹ️')
        .setLabel('Info')
        .setStyle(ButtonStyle.Secondary)
    )
  );

  return { components: [c], flags: MessageFlags.IsComponentsV2 };
}

async function refreshJ2CPanel(guild, channelId) {
  try {
    const { J2CChannel } = require('@db/join2create.js');
    const j2cDoc = await J2CChannel.findOne({ channelId });
    if (!j2cDoc?.interfaceMessageId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const owner = await guild.members.fetch(j2cDoc.ownerId).catch(() => null);
    if (!owner) return;

    const panelMsg = await channel.messages.fetch(j2cDoc.interfaceMessageId).catch(() => null);
    if (!panelMsg) return;

    const panelData = buildJ2CPanel(channel, owner, j2cDoc);
    await panelMsg.edit(panelData);
  } catch (_) {}
}

module.exports = { buildJ2CPanel, refreshJ2CPanel };
