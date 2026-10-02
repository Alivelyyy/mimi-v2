const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "movefast",
  aliases: ['mf', 'fastmove'],
  cooldown: "5",
  category: "owner",
  usage: "<@user/userId>",
  description: "Rapidly move a user between voice channels",
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: true,
  botPerms: ["MoveMembers"],
  userPerms: [],
  execute: async (client, message, args, emoji) => {
    try {
      const member = message.mentions.members.first() 
        || await message.guild.members.fetch(args[0]).catch(() => null);

      if (!member) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid User`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Please specify a valid user\n` +
            `${blackEmoji.arrow} **Usage:** \`${client.prefix}movefast @user\``
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      if (!member.voice.channel) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Not in Voice`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} That user is not in a voice channel`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const voiceChannels = message.guild.channels.cache.filter(c => c.type === 2);
      if (voiceChannels.size < 2) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Not Enough Channels`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Need at least 2 voice channels to perform this action`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const loadingContainer = new ContainerBuilder();
      loadingContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Moving User`)
      );
      loadingContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      loadingContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.user} **Target:** ${member.user.tag}\n` +
          `${blackEmoji.arrow} Moving between voice channels...`
        )
      );
      message.reply({
        components: [loadingContainer],
        flags: MessageFlags.IsComponentsV2,
      });

      for (let i = 0; i < 100; i++) {
        const channels = [...voiceChannels.values()];
        const randomChannel = channels[Math.floor(Math.random() * channels.length)];
        
        try {
          await member.voice.setChannel(randomChannel);
          await client.sleep(500);
        } catch (e) {
          break;
        }
      }

    } catch (error) {
      console.error("MoveSpeed Command Error:", error);
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Error Occurred`)
      );
      errorContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} An error occurred while moving the user\n` +
          `${blackEmoji.arrow} **Error:** ${error.message}`
        )
      );
      return message.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  }
};
