const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "reload",
  aliases: ['rl', 'reloadcmd'],
  cooldown: "",
  category: "owner",
  usage: "<all / commands / events / emojis / functions>",
  description: "Reloads given argument",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: true,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const loadingContainer = new ContainerBuilder();
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Reloading`)
    );
    loadingContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${blackEmoji.arrow} Please wait...`)
    );
    
    const m = await message.reply({
      components: [loadingContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    let res = ``;
    let target = args[0];
    
    switch (target) {
      case "events":
        res = await require("@reloaders/reloadEvents.js")(client);
        break;
      case "emojis":
        res = [await require("@reloaders/reloadEmojis.js")(client)];
        break;
      case "commands":
        res = [await require("@reloaders/reloadCommands.js")(client)];
        break;
      case "functions":
        res = [await require("@reloaders/reloadFunctions.js")(client)];
        break;
      case "all":
      default:
        res = await Promise.all([
          await require("@reloaders/reloadEmojis.js")(client),
          await require("@reloaders/reloadFunctions.js")(client),
          await require("@reloaders/reloadCommands.js")(client),
          await require("@reloaders/reloadEvents.js")(client),
        ]);
        break;
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Reload Complete`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Target:** \`${target}\`\n\n` +
        `**Results:**\n${res.join("\n")}`
      )
    );
    await m.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
