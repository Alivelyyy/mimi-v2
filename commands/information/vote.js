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
  name: "vote",
  aliases: ['topgg', 'voteme'],
  cooldown: "",
  category: "information",
  usage: "",
  description: "Get vote link",
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
    const voteUrl = `https://top.gg/bot/${client.user.id}/vote`;

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.Vote} Vote for ${client.user.username}`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.heart} Support Us!\n\n` +
        `> ${blackEmoji.arrow} Help us grow by voting on Top.gg\n` +
        `> ${blackEmoji.arrow} Voting is free and only takes seconds\n\n` +
        `### ${blackEmoji.trophy} Vote Rewards\n` +
        `> ${blackEmoji.diamond} **Vote-locked commands** access\n` +
        `> ${blackEmoji.free} **Bypass cooldowns** temporarily`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Vote on Top.gg")
          .setURL(voteUrl)
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