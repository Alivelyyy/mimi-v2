const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");

module.exports = {
  name: "playerDestroy",
  run: async (client, player) => {
    const previousMessage = player.data.get("message");
    
    if (previousMessage) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${client.emoji.off} Player Stopped`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`The music player has been disconnected.`)
      );

      await previousMessage.edit({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    }

    player.data.delete("autoplay");
    player.data.delete("message");

    console.log(`Player destroyed in guild ${player.guildId}`);
  }
};