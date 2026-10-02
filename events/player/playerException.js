const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");

module.exports = {
  name: "playerException",
  run: async (client, player, error) => {
    const channel = client.channels.cache.get(player.textId);
    if (!channel) return;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${client.emoji.no} Player Exception`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `A playback exception occurred.\n` +
        `**Message:** \`${error.exception.message}\``
      )
    );

    await channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    }).catch(() => {});

    await client.webhooks.error.send({
      username: client.user.username,
      avatarURL: client.user.displayAvatarURL(),
      components: [
        new client.embed()
          .title("Player Exception")
          .desc(`Guild: ${channel.guild.name} (${player.guildId})\nException: ${error.exception.message}`)
      ],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});

    await player.destroy();
  }
};