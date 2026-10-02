const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "purgebots",
  aliases: ['pb', 'deletebots'],
  cooldown: "5",
  category: "utility",
  description: "Delete bot messages from the channel",
  usage: "<amount>",
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [PermissionsBitField.Flags.ManageMessages],
  userPerms: [PermissionsBitField.Flags.ManageMessages],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,

  execute: async (client, message, args) => {
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide a number between **1** and **100**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      await message.delete().catch(() => {});
      const fetched = await message.channel.messages.fetch({ limit: amount });
      const botMessages = fetched.filter(msg => msg.author.bot);

      if (botMessages.size === 0) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No bot messages found in the last **${amount}** messages.`));
        return message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const deleted = await message.channel.bulkDelete(botMessages, true);

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Deleted **${deleted.size}** bot messages.`
      ));
      const reply = await message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
      setTimeout(() => reply.delete().catch(() => {}), 3000);
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Failed to delete messages. Messages older than 14 days cannot be bulk deleted.`
      ));
      message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  }
};
