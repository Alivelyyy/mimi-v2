
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");

module.exports = {
  name: "infoRequested",
  run: async (client, message, command) => {
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////// Reply with info about cmd requested ////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    
    const container = new ContainerBuilder();
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## Command info - ${command.name.charAt(0).toUpperCase() + command.name.slice(1)}`
      )
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${client.emoji.free} **Aliases:** ${
          command.aliases?.[0]
            ? `${command.aliases.join(", ")}`
            : "No aliases"
        }\n` +
        `${client.emoji.message} **Usage:** [\`${client.prefix}${command.name} ${command.usage}\`](${client.support})\n` +
        `${client.emoji.bell} **Description:** ${
          command.description || `No description available`
        }\n\n` +
        `\`\`\`js\n` +
        `<> = required | [] = optional` +
        `\n\`\`\``
      )
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications
    });
  },
};
