const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "purge",
  aliases: ['clear', 'prune'],
  cooldown: "5",
  category: "utility",
  description: "Delete multiple messages at once",
  usage: "<amount> [@user]",
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

    const targetUser = message.mentions.users.first();

    try {
      await message.delete().catch(() => {});

      if (targetUser) {
        const fetched = await message.channel.messages.fetch({ limit: 100 });
        const userMsgs = fetched.filter(m => m.author.id === targetUser.id).first(amount);
        const deleted = await message.channel.bulkDelete(userMsgs, true);

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.yes} Deleted **${deleted.size}** messages from ${targetUser}.`
        ));
        const reply = await message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
        setTimeout(() => reply.delete().catch(() => {}), 3000);
      } else {
        const deleted = await message.channel.bulkDelete(amount, true);

        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.yes} Successfully deleted **${deleted.size}** messages.`
        ));
        const reply = await message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
        setTimeout(() => reply.delete().catch(() => {}), 3000);
      }
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Failed to delete messages. Messages older than 14 days cannot be bulk deleted.`
      ));
      message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  }
};
