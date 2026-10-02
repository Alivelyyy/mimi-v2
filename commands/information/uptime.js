/** @format
 *
 * Kyoko By Doubiest
 * Version: 6.0.0-beta
 * © 2024 Nemesis-Dev
 */

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "uptime",
  aliases: ['up', 'runtime'],
  cooldown: "",
  category: "information",
  usage: "",
  description: "Shows bot's uptime stats",
  args: false,
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
  execute: async (client, message, args, emoji) => {
    // Get current time in seconds
    const currentTime = Math.floor(Date.now() / 1000);

    // Calculate bot's uptime in seconds
    const uptimeSeconds = Math.floor(client.uptime / 1000);

    // Calculate the timestamp for bot's online time
    const onlineTimestamp = currentTime - uptimeSeconds;

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.Online} Bot Uptime`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`I am online from <t:${onlineTimestamp}:R>`)
    );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};