const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { J2CChannel } = require('@db/join2create.js');

module.exports = {
  name: 'j2cinfo',
  aliases: ['vcinfo', 'j2ci'],
  cooldown: '',
  category: 'join2create',
  usage: '',
  description: 'View information about your current Join-to-Create channel',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const memberVoice = message.member.voice.channel;
    if (!memberVoice) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You must be in a voice channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const vcDoc = await J2CChannel.findOne({ channelId: memberVoice.id });
    if (!vcDoc) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This is not a Join-to-Create channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const owner = await client.users.fetch(vcDoc.ownerId).catch(() => null);
    const createdAgo = `<t:${Math.floor(vcDoc.createdAt.getTime() / 1000)}:R>`;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.mic} Channel Info — ${memberVoice.name}`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    const lockStatus = vcDoc.locked ? `${blackEmoji.on} Locked` : `${blackEmoji.off} Unlocked`;
    const hideStatus = vcDoc.hidden ? `${blackEmoji.on} Hidden` : `${blackEmoji.off} Visible`;

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.cog} Settings\n` +
        `> ${blackEmoji.arrow} **Owner:** ${owner ? `<@${owner.id}>` : 'Unknown'}\n` +
        `> ${blackEmoji.arrow} **Status:** ${lockStatus}\n` +
        `> ${blackEmoji.arrow} **Visibility:** ${hideStatus}\n` +
        `> ${blackEmoji.arrow} **User Limit:** \`${memberVoice.userLimit}\`\n` +
        `> ${blackEmoji.arrow} **Bitrate:** \`${Math.floor(memberVoice.bitrate / 1000)}kbps\`\n` +
        `> ${blackEmoji.arrow} **Region:** \`${memberVoice.rtcRegion}\`\n` +
        `> ${blackEmoji.arrow} **Members:** \`${memberVoice.members.size}\`\n` +
        `> ${blackEmoji.arrow} **Created:** ${createdAgo}`
      )
    );

    if (vcDoc.permittedUsers.length > 0) {
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${blackEmoji.yes} Permitted Users\n` +
          vcDoc.permittedUsers.map(id => `> <@${id}>`).join('\n')
        )
      );
    }

    if (vcDoc.bannedUsers.length > 0) {
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${blackEmoji.no} Banned Users\n` +
          vcDoc.bannedUsers.map(id => `> <@${id}>`).join('\n')
        )
      );
    }

    await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
