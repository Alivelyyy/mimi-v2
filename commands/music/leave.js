const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  MessageFlags 
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "leave",
  aliases: ['dc', 'disconnect'],
  cooldown: "",
  category: "music",
  usage: "",
  description: "leave voice channel",
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
    const player = await client.getPlayer(message.guild.id);

    let id = player.voiceId;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Leaving Channel`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} Leaving <#${id}>...`
      )
    );

    let m = await message
      .reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      })
      .catch(() => {});

    try {
      if (player) {
        const playerMessage = player.data.get("message");
        if (playerMessage) {
          await playerMessage.delete().catch(() => {});
        }
        
        await player.destroy();
      }

      await message.guild.members.me.voice.disconnect().catch(() => {});
      
      await m?.delete().catch(() => {});
      
      await message.react(blackEmoji.checkReact).catch(() => {});
    } catch (error) {
      console.error("Error in leave command:", error);
      await m?.delete().catch(() => {});
    }
  },
};
