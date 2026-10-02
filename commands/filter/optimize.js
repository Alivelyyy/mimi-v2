const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "optimize",
  aliases: ['opt', 'netfix'],
  cooldown: "",
  category: "filter",
  usage: "",
  description: "Optimize for poor network",
  args: false,
  vote: false,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args) => {
    const { channel } = message.member.voice;

    let res;
    try {
      channel.edit({
        bitrate: 8000,
      });
      res = `${blackEmoji.yes} Set voice channel bitrate to **8kbps**`;
    } catch (e) {
      res = `${blackEmoji.bell} Please set the vc bitrate to min manually`;
    }

    const processingContainer = new ContainerBuilder();
    processingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${blackEmoji.cool} **Adjusting parameters for better connectivity !**`)
    );

    await message
      .reply({
        components: [processingContainer],
        flags: MessageFlags.IsComponentsV2,
      })
      .then(async (fb) =>
        setTimeout(async () => {
          const successContainer = new ContainerBuilder();
          successContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# Optimization Complete`)
          );
          successContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          successContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${res}\n` +
              `${blackEmoji.yes} Optimized params for best experience\n` +
              `${blackEmoji.yes} Audio spectrum - **Sonarworks target**`
            )
          );
          await fb
            .edit({
              components: [successContainer],
              flags: MessageFlags.IsComponentsV2,
            })
            .catch(() => {});
        }, 2000),
      )
      .catch(() => {});
  },
};
