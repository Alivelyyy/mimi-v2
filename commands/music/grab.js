const { 
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "grab",
  aliases: ['dm2', 'songdm'],
  cooldown: "5",
  category: "music",
  description: "Get current song info in your DMs",
  args: false,
  vote: true,
  new: true,
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, prefix) => {
    const player = await client.getPlayer(message.guild.id);
    const track = player.queue.current;

    if (!track) {
      const noTrackContainer = new ContainerBuilder();
      noTrackContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} No Track Playing`)
      );
      noTrackContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      noTrackContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} There is no track currently playing\n` +
          `${blackEmoji.arrow} Use \`${client.prefix}play\` to start playing music`
        )
      );
      return message.reply({
        components: [noTrackContainer],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const dmContainer = new ContainerBuilder();
    dmContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.music} Track Information`)
    );
    dmContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    dmContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Title:** [${track.title}](${track.uri})\n` +
        `${blackEmoji.arrow} **Author:** ${track.author}\n` +
        `${blackEmoji.arrow} **Duration:** \`${track.isStream ? "LIVE" : client.formatTime(track.length)}\`\n` +
        `${blackEmoji.arrow} **Requested by:** ${track.requester.tag}\n` +
        `${blackEmoji.arrow} **From:** ${message.guild.name}`
      )
    );
    dmContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    dmContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Play Track")
          .setURL(track.uri)
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setLabel("Add Bot")
          .setURL(client.invite.required)
          .setStyle(ButtonStyle.Link)
      )
    );

    try {
      await message.author.send({
        components: [dmContainer],
        flags: MessageFlags.IsComponentsV2
      });

      const successContainer = new ContainerBuilder();
      successContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Track Sent`)
      );
      successContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      successContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Track info sent to your DMs!\n` +
          `${blackEmoji.arrow} **Track:** ${track.title.substring(0, 40)}...`
        )
      );
      return message.reply({
        components: [successContainer],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (error) {
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} DM Failed`)
      );
      errorContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Could not send you a DM\n` +
          `${blackEmoji.arrow} Please enable DMs from server members`
        )
      );
      return message.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2
      });
    }
  }
};
