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
  name: 'softban',
  aliases: ['sb', 'tempban'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user> [reason]',
  description: 'Softban a user — ban then immediately unban to delete their messages',
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
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!target) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid member.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (target.id === message.author.id || target.id === client.user.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You cannot softban yourself or the bot.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (!target.bannable) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} I cannot ban **${target.user.tag}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (message.member.roles.highest.comparePositionTo(target.roles.highest) <= 0 && message.guild.ownerId !== message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You cannot softban someone with an equal or higher role.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const reason = args.slice(1).join(' ');

    try {
      await target.send({
        components: [(() => {
          const dc = new ContainerBuilder();
          dc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${blackEmoji.warn} You have been softbanned\n**Server:** ${message.guild.name}\n**Reason:** ${reason}\n*You may rejoin the server.*`
          ));
          return dc;
        })()],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});

      await message.guild.members.ban(target.id, { deleteMessageSeconds: 604800, reason: `Softban by ${message.author.tag}: ${reason}` });
      await message.guild.members.unban(target.id, 'Softban — auto unban');

      const caseId = await logModAction(message.guild, 'softban', {
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason
      });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} User Softbanned`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${target.user.tag} (\`${target.id}\`)\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}\n` +
        `${blackEmoji.arrow} Messages from the past 7 days deleted. User may rejoin.\n` +
        `${blackEmoji.list} **Case:** #${caseId}`
      ));

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to softban: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
