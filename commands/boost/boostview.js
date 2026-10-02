const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Boost = require('@db/boostSchema.js');

module.exports = {
  name: 'boostview',
  aliases: ['bview', 'boostcfg'],
  cooldown: '',
  category: 'boost',
  usage: '',
  description: 'View current boost message configuration',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message) => {
    const doc = await Boost.findOne({ guildId: message.guild.id });

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} Boost Configuration`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    if (!doc) {
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.off} Boost messages are **not configured**.\n` +
        `Use \`${client.prefix}setboost #channel [message]\` to set up.`
      ));
    } else {
      const statusIcon = doc.enabled ? (blackEmoji.on) : (blackEmoji.off);
      const channelText = doc.channelId ? `<#${doc.channelId}>` : 'Not set';

      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${statusIcon} **Status:** ${doc.enabled ? 'Enabled' : 'Disabled'}\n` +
        `${blackEmoji.channel} **Channel:** ${channelText}\n` +
        `${blackEmoji.message} **Message:**\n\`\`\`${doc.message}\`\`\`\n` +
        `${blackEmoji.info} **Placeholders:** \`{user}\`, \`{username}\`, \`{usertag}\`, \`{userid}\`, \`{useravatar}\`, \`{server}\`, \`{servericon}\`, \`{count}\`, \`{boostcount}\`, \`{boosttier}\``
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} \`${client.prefix}boostchannel #ch\` — Change channel\n` +
        `${blackEmoji.arrow} \`${client.prefix}boostmessage <msg>\` — Change message\n` +
        `${blackEmoji.arrow} \`${client.prefix}boostdisable\` — Disable\n` +
        `${blackEmoji.arrow} \`${client.prefix}boosttest\` — Test`
      ));
    }

    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
