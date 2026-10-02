const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");

module.exports = {
  name: "playerError",
  run: async (client, player, type, error) => {
    const channel = client.channels.cache.get(player.textId);
    if (!channel) return;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${client.emoji.no} Player Error`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `An error occurred while playing music.\n` +
        `**Type:** \`${type}\`\n` +
        `**Error:** \`${error.message}\``
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
          .title("Player Error")
          .desc(`Guild: ${channel.guild.name} (${player.guildId})\nType: ${type}\nError: ${error.message}`)
      ],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});

    await player.destroy();
  }
};