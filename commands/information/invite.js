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
  name: "invite",
  aliases: ['inv', 'addbot'],
  cooldown: "",
  category: "information",
  usage: "",
  description: "Get bot invite link",
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
      new TextDisplayBuilder().setContent(`# ${blackEmoji.link} Invite ${client.user.username}`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.heart} Add Me to Your Server!\n\n` +
        `> ${blackEmoji.arrow} Choose your preferred permission level below\n\n` +
        `### ${blackEmoji.cog} Permission Options\n` +
        `> ${blackEmoji.admin} **Admin Perms** - Full access to all features\n` +
        `> ${blackEmoji.mod} **Required Perms** - Minimal permissions needed`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Admin Perms")
          .setURL(`https://discord.com/oauth2/authorize?client_id=1467845290743697575&scope=bot%20applications.commands&permissions=8`)
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setLabel("Required Perms")
          .setURL(`https://discord.com/oauth2/authorize?client_id=1467845290743697575&scope=bot%20applications.commands&permissions=242769841728`)
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setLabel("Support Server")
          .setURL(client.support)
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
    }).catch(() => {});
  },
};