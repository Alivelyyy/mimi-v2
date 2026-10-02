const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  MessageFlags 
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "rejoin",
  aliases: ['rj', 'reconnect'],
  cooldown: "",
  category: "music",
  usage: "",
  description: "rejoin a voice channel",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: true,
  queue: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, prefix) => {
    const { channel } = message.member.voice;
    const player = await client.getPlayer(message.guild.id);

    const loadingContainer = new ContainerBuilder();
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Rejoining Channel`)
    );
    loadingContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Destroying current player...\n` +
        `${blackEmoji.arrow} Rejoining <#${channel.id}>...`
      )
    );

    let msg = await message
      .reply({
        components: [loadingContainer],
        flags: MessageFlags.IsComponentsV2
      })
      .catch(() => {});

    await player.destroy();
    await client.sleep(1500);
    await client.manager.createPlayer({
      voiceId: channel.id,
      textId: message.channel.id,
      guildId: message.guild.id,
      shardId: message.guild.shardId,
      loadBalancer: true,
      deaf: true,
    });

    const successContainer = new ContainerBuilder();
    successContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Rejoined Successfully`)
    );
    successContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    successContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Voice:** <#${channel.id}>\n` +
        `${blackEmoji.arrow} **Text:** <#${message.channel.id}>\n` +
        `${blackEmoji.arrow} **Rejoined by:** ${message.author}`
      )
    );
    await msg?.edit({ components: [successContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  },
};
