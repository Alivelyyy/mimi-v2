const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");
const autoplay = require("@functions/autoplay");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "playerEmpty",
  run: async (client, player) => {
    const channel = client.channels.cache.get(player.textId);
    const previousMessage = player.data.get("message");

    if (player.data.get("autoplay")) {
      if (previousMessage) await previousMessage.delete().catch(() => {});
      return autoplay(client, player, channel);
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Queue Finished`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`The queue has ended. Add more songs to keep the party going!`)
    );

    if (previousMessage) {
      await previousMessage.edit({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    } else if (channel) {
      await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    }

    try {
      const guild = client.guilds.cache.get(player.guildId);
      if (guild) {
        const voiceChannel = guild.members.me?.voice?.channel;
        if (voiceChannel) {
          await client.rest.put(`/channels/${voiceChannel.id}/voice-status`, {
            body: { status: '' }
          }).catch(() => {});
        }
      }
    } catch (err) {}

    const is247 = await client.db.twoFourSeven.get(`${client.user.id}_${player.guildId}`);
    if (is247) return;

    await client.sleep(60000);
    const currentPlayer = await client.getPlayer(player.guildId);
    if (currentPlayer && !currentPlayer.playing && currentPlayer.queue.length === 0) {
      if (channel) {
        await channel.send({
          content: `${blackEmoji.bell} Left voice channel due to inactivity.`
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});
      }
      await currentPlayer.destroy();
    }
  }
};
