const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Boost = require('@db/boostSchema.js');

module.exports = {
  name: 'boostmessage',
  aliases: ['bmsg', 'boostmsg'],
  cooldown: '',
  category: 'boost',
  usage: '<message>',
  description: 'Change the boost message text',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const doc = await Boost.findOne({ guildId: message.guild.id });
    if (!doc) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No boost message configured. Use \`${client.prefix}setboost #channel\` first.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const newMsg = args.join(' ');
    if (!newMsg) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide a message.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    await Boost.updateOne({ guildId: message.guild.id }, { $set: { message: newMsg, updatedAt: new Date() } });

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Boost Message Updated`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.message} **New Message:**\n${newMsg}\n\n` +
      `${blackEmoji.info} **Placeholders:** \`{user}\`, \`{username}\`, \`{usertag}\`, \`{userid}\`, \`{useravatar}\`, \`{server}\`, \`{servericon}\`, \`{count}\`, \`{boostcount}\`, \`{boosttier}\`, \`{embed:name}\`\n` +
      `Test with \`${client.prefix}boosttest\`.`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
