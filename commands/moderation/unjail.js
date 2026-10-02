const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Jail = require('@db/jail.js');
const { logModAction } = require('@utils/modLogger.js');

module.exports = {
  name: 'unjail',
  aliases: ['uj', 'freejail'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user> [reason]',
  description: 'Release a user from jail',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageRoles'], userPerms: ['ManageRoles'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!member) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid member.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
    const doc = await Jail.findOne({ guildId: message.guild.id });
    if (!doc) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Jail system is not set up.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
    const jailedEntry = doc.jailedUsers.find(j => j.userId === member.id);
    if (!jailedEntry) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This user is not jailed.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const reason = args.slice(1).join(' ');

    try {
      const rolesToRestore = jailedEntry.roles.filter(id => message.guild.roles.cache.has(id));
      await member.roles.set(rolesToRestore, `Unjailed: ${reason}`).catch(() => {});
      doc.jailedUsers = doc.jailedUsers.filter(j => j.userId !== member.id);
      await doc.save();

      const caseId = await logModAction(message.guild, 'unjail', {
        targetId: member.id,
        targetTag: member.user.tag,
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason
      });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Member Unjailed`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${member.user.tag} (\`${member.id}\`)\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}\n` +
        `${blackEmoji.list} **Case:** #${caseId}\n` +
        `${blackEmoji.arrow} Roles have been restored.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to unjail: ${err.message}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
