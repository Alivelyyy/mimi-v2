const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags
} = require("discord.js");

module.exports = {
  name: "say",
  aliases: ['echo', 'repeat'],
  cooldown: "5",
  category: "fun",
  usage: "<message>",
  description: "Make the bot say something",
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ["SendMessages"],
  userPerms: ["ManageMessages"],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    try {
      await message.delete().catch(() => {});
      const content = args.join(" ");
      await message.channel.send({ content, allowedMentions: { parse: [] } });
    } catch (error) {
      console.error("Say Command Error:", error);
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${emoji.warn} An error occurred while executing the command.`)
      );
      message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  }
};
