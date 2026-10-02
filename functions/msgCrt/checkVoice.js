
const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags
} = require("discord.js");

module.exports = async (message, command, client = message.client) => {
  if (
    (command.inVoiceChannel && !message.member.voice.channelId) ||
    (command.sameVoiceChannel &&
      message.guild.members.me.voice.channel &&
      message.guild.members.me.voice.channelId !==
        message.member.voice.channelId)
  ) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${client.emoji.warn} **You must be in ${
          message.guild.members.me.voice.channel || `a voice channel`
        } to use this command**`
      )
    );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
    return false;
  }

  const player = await client.getPlayer(message.guild.id);

  if (command.player && !player) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${client.emoji.warn} **I am not connected to any voice channel**`
      )
    );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
    return false;
  }

  if (command.queue && !player.queue.current) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${client.emoji.warn} **The queue is empty!**`
      )
    );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
    return false;
  }

  return true;
};
