const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { logModAction } = require('@utils/modLogger.js');

module.exports = {
  name: 'unban',
  aliases: ['ub', 'pardon'],
  cooldown: '',
  category: 'moderation',
  usage: '<userId> [reason]',
  description: 'Unban a user from the server by their ID',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ['BanMembers'],
  userPerms: ['BanMembers'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const userId = args[0].replace(/[<@!>]/g, '');
    const reason = args.slice(1).join(' ');

    if (!/^\d+$/.test(userId)) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please provide a valid user ID.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      const bans = await message.guild.bans.fetch();
      const ban = bans.get(userId);

      if (!ban) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} That user is not banned in this server.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      await message.guild.members.unban(userId, `${message.author.tag}: ${reason}`);

      const caseId = await logModAction(message.guild, 'unban', {
        targetId: userId,
        targetTag: ban.user.tag,
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason
      });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} User Unbanned`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${ban.user.tag} (\`${userId}\`)\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}\n` +
        `${blackEmoji.list} **Case:** #${caseId}`
      ));

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to unban: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
