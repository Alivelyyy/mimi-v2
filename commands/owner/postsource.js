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
  name: "postsource",
  aliases: ['sourcepost', 'opensource'],
  cooldown: "",
  category: "admin",
  usage: "",
  description: "Post a source code embed",
  args: false,
  vote: false,
  new: true,
  admin: true,
  owner: true,

  execute: async (client, message, args) => {

    const container = new ContainerBuilder();

    // Title
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${blackEmoji.music} Apex Nuker - Nuke Bot`
      )
    );

    // Divider
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    // Source Info
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.files} Source Information\n\n` +
        `> ${blackEmoji.arrow} **Source Code No:** \`#002\`\n` +
        `> ${blackEmoji.arrow} **Source Code Name:** Apex Nuker - Nuke Bot\n` +
        `> ${blackEmoji.arrow} **Status:** ${blackEmoji.online} Working`
      )
    );

    // Divider
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    // Tech Stack
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.cog} Tech Stack\n\n` +
        `> ${blackEmoji.arrow} Python`
      )
    );

    // Divider
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    // Links
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.link} Links\n\n` +
        `> ${blackEmoji.arrow} **Github:** https://github.com/alivelyyy/ApeX-Nuker\n` +
        `> ${blackEmoji.arrow} **Youtube Tutorial:** https://youtube.com/\n\n` +
        `> ${blackEmoji.point} Download the source code from github.`
      )
    );

    // Buttons
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Github")
          .setStyle(ButtonStyle.Link)
          .setURL("https://github.com/alivelyyy/ApeX-Nuker"),

        new ButtonBuilder()
          .setLabel("Youtube")
          .setStyle(ButtonStyle.Link)
          .setURL("https://youtube.com/")
      )
    );

    // Divider
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    // Footer
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.info} Posted by ${message.author.username}`
      )
    );

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

  }
};