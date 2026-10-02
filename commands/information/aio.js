const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const emoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'aio',
  aliases: ['allinone', 'aiomanager'],
  cooldown: '',
  category: 'information',
  usage: '<enable|disable>',
  description: 'Enable or disable all-in-one server management modules',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${emoji.warn} **AIO support has been removed**\n\nThe old AIO enable/disable module is no longer supported. Use the individual command systems directly.`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  }
};
