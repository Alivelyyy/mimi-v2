const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "debug",
  category: "music",
  description: "Resets player settings (rejoin, volume 100, default search engine)",
  player: true,
  inVoiceChannel: false,
  sameVoiceChannel: false,

  execute: async (client, message, args, prefix) => {
    const { channel } = message.member.voice;
    let player = await client.getPlayer(message.guild.id);

    const loadingContainer = new ContainerBuilder();
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Debugging Player`)
    );
    loadingContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Resetting volume to \`100\`...\n` +
        `${blackEmoji.arrow} Resetting engine to \`spotify\`...\n` +
        `${blackEmoji.arrow} Rejoining channel...`
      )
    );

    let msg = await message.reply({
      components: [loadingContainer],
      flags: MessageFlags.IsComponentsV2
    }).catch(() => {});

    // 1. Reset Engine
    const musicSource = require("@db/musicSource.js");
    await musicSource.set(`${message.author.id}`, "spotify");

    // 2. Reset Volume and Rejoin (Destroy and Recreate)
    await player.destroy();
    await client.sleep(1000);

    player = await client.manager.createPlayer({
      voiceId: channel.id,
      textId: message.channel.id,
      guildId: message.guild.id,
      shardId: message.guild.shardId,
      loadBalancer: true,
      deaf: true,
    });

    await player.setVolume(100);

    const successContainer = new ContainerBuilder();
    successContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Debug Complete`)
    );
    successContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    successContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Volume:** \`100%\`\n` +
        `${blackEmoji.arrow} **Engine:** \`Spotify\`\n` +
        `${blackEmoji.arrow} **Status:** Rejoined Successfully\n` +
        `${blackEmoji.arrow} **Debug by:** ${message.author}`
      )
    );

    await msg?.edit({
      components: [successContainer],
      flags: MessageFlags.IsComponentsV2
    }).catch(() => {});
  },
};
