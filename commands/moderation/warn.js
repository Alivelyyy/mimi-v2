const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const ModWarn = require('@db/modWarn.js');
const { logModAction } = require('@utils/modLogger.js');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  name: 'warn',
  aliases: ['w', 'warning'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user> [reason]',
  description: 'Warn a member and log it',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: ['ModerateMembers'],
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

    if (target.id === message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You cannot warn yourself.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (target.user.bot) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You cannot warn bots.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const reason = args.slice(1).join(' ');
    const warnId = uuidv4().slice(0, 8).toUpperCase();

    try {
      const doc = await ModWarn.findOneAndUpdate(
        { guildId: message.guild.id, userId: target.id },
        {
          $push: {
            warnings: {
              warnId,
              moderatorId: message.author.id,
              reason,
              timestamp: new Date()
            }
          }
        },
        { upsert: true, new: true }
      );

      const totalWarns = doc.warnings.length;

      const caseId = await logModAction(message.guild, 'warn', {
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason,
        extra: `**Warn ID:** \`${warnId}\` \u2022 **Total:** ${totalWarns}`
      });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.warn} Member Warned`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${target.user.tag} (\`${target.id}\`)\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}\n` +
        `${blackEmoji.list} **Warn ID:** \`${warnId}\`\n` +
        `${blackEmoji.bell} **Total Warnings:** ${totalWarns}\n` +
        `${blackEmoji.list} **Case:** #${caseId}`
      ));

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });

      target.send({
        components: [(() => {
          const dc = new ContainerBuilder();
          dc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${blackEmoji.warn} You received a warning\n**Server:** ${message.guild.name}\n**Reason:** ${reason}\n**ID:** \`${warnId}\`\n**Total Warnings:** ${totalWarns}`
          ));
          return dc;
        })()],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to warn: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
