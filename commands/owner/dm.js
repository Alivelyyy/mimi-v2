const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "dm",
  aliases: ['directmessage', 'owndm'],
  cooldown: "5",
  category: "owner",
  usage: "<user> <message>",
  description: "Send a DM to a user through the bot",
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: true,
  botPerms: ["SendMessages"],
  userPerms: [],
  execute: async (client, message, args, emoji) => {
    try {
      const user = message.mentions.users.first() 
        || await client.users.fetch(args[0]).catch(() => null);

      if (!user) {
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
            `${blackEmoji.arrow} **Usage:** \`${client.prefix}dm @user <message>\``
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const content = args.slice(1).join(" ");
      if (!content) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Missing Message`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Please provide a message to send\n` +
            `${blackEmoji.arrow} **Usage:** \`${client.prefix}dm @user <message>\``
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      await user.send(content);

      const successContainer = new ContainerBuilder();
      successContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.message} Message Sent`)
      );
      successContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      successContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.user} **Recipient:** ${user.tag}\n` +
          `${blackEmoji.arrow} **Message:** ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
        )
      );
      return message.reply({
        components: [successContainer],
        flags: MessageFlags.IsComponentsV2,
      });

    } catch (error) {
      console.error("DM Command Error:", error);
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Failed to Send`)
      );
      errorContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Could not send DM to the user\n` +
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
