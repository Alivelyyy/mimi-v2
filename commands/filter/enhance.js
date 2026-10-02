const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "enhance",
  aliases: ['enh', 'audioquality'],
  cooldown: "",
  category: "filter",
  usage: "",
  description: "Optimize for best audio quality",
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
    const player = await client.getPlayer(message.guild.id);

    const { channel } = message.member.voice;

    let bitrate = 64000;
    switch (message.guild.premiumTier) {
      case 0:
        bitrate = 96000;
        break;
      case 1:
        bitrate = 128000;
        break;
      case 2:
        bitrate = 256000;
        break;
      case 3:
        bitrate = 384000;
        break;
    }

    let res;
    try {
      channel.edit({
        bitrate: bitrate,
      });
      res = `${blackEmoji.yes} Set voice channel bitrate to **${
        bitrate / 1000
      }kbps**`;
    } catch (e) {
      res = `${blackEmoji.bell} *Please set the vc bitrate to max manually*`;
    }

    await player.shoukaku.setFilters({
      op: "filters",
      guildId: message.guild.id,
      equalizer: [
        { band: 0, gain: 0.05  },
        { band: 1, gain: 0.06  },
        { band: 2, gain: 0.12  },
        { band: 3, gain: 0.02  },
        { band: 4, gain: 0.125  },
        { band: 5, gain: 0.025  },
        { band: 6, gain: -0.05  },
        { band: 7, gain: -0.1  },
        { band: 8, gain: -0.05  },
        { band: 9, gain: 0.02  },
        { band: 10, gain: 0.01  },
        { band: 11, gain: 0.065  },
        { band: 12, gain: 0.1  },
        { band: 13, gain: 0.14  },
        { band: 14, gain: 0.08  },
      ],
    });

    await player.setVolume(80);

    const processingContainer = new ContainerBuilder();
    processingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${blackEmoji.cool} **Adjusting parameters for a richer and fuller sound !**`)
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
            new TextDisplayBuilder().setContent(`# Enhancement Applied`)
          );
          successContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          successContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${res}\n` +
              `${blackEmoji.yes} Set vol to **80%** to reduce distortions\n` +
              `${blackEmoji.yes} Optimized params for best experience\n` +
              `${blackEmoji.yes} Audio spectrum - **Harman target 2019**`
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
