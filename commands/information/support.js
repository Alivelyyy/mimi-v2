const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "support",
  aliases: ['sv', 'supportserver'],
  cooldown: "",
  category: "information",
  usage: "",
  description: "Get support server link",
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
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.heart} Support Server`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.team} Need Help?\n\n` +
        `> ${blackEmoji.arrow} Join our official support server\n` +
        `> ${blackEmoji.arrow} Get help from our friendly team\n` +
        `> ${blackEmoji.arrow} Report bugs and suggest features\n` +
        `> ${blackEmoji.arrow} Stay updated with announcements`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Join Support Server")
          .setURL(client.support)
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setLabel("Invite Bot")
          .setURL(client.invite.admin)
          .setStyle(ButtonStyle.Link)
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${blackEmoji.info} Requested by ${message.author.username}`)
    );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};