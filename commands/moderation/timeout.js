const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { logModAction } = require('@utils/modLogger.js');

const durations = {
  '60s': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000
};

function parseDuration(str) {
  if (!str) return null;
  const s = str.toLowerCase();
  if (durations[s]) return durations[s];
  const match = s.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const [, num, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return parseInt(num) * multipliers[unit];
}

module.exports = {
  name: 'timeout',
  aliases: ['mute', 'to'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user> <duration: 60s/5m/1h/1d> [reason]',
  description: 'Timeout (mute) a member for a specified duration',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: ['ModerateMembers'],
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
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You cannot timeout yourself.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const durationStr = args[1];
    const ms = parseDuration(durationStr);

    if (!ms || ms < 5000 || ms > 28 * 24 * 60 * 60 * 1000) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} Invalid duration. Use formats like \`60s\`, \`5m\`, \`1h\`, \`1d\`.\n` +
        `Maximum is **28 days**.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (!target.moderatable) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} I cannot timeout **${target.user.tag}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (message.member.roles.highest.comparePositionTo(target.roles.highest) <= 0 && message.guild.ownerId !== message.author.id) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You cannot timeout someone with an equal or higher role.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const reason = args.slice(2).join(' ');

    try {
      await target.timeout(ms, `${message.author.tag}: ${reason}`);

      const until = Math.floor((Date.now() + ms) / 1000);

      const caseId = await logModAction(message.guild, 'timeout', {
        targetId: target.id,
        targetTag: target.user.tag,
        moderatorId: message.author.id,
        moderatorTag: message.author.tag,
        reason,
        duration: durationStr
      });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Member Timed Out`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${target.user.tag} (\`${target.id}\`)\n` +
        `${blackEmoji.time} **Duration:** ${durationStr} (until <t:${until}:F>)\n` +
        `${blackEmoji.mod} **Moderator:** ${message.author.tag}\n` +
        `${blackEmoji.info} **Reason:** ${reason}\n` +
        `${blackEmoji.list} **Case:** #${caseId}`
      ));

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });

      target.send({
        components: [(() => {
          const dc = new ContainerBuilder();
          dc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `# ${blackEmoji.warn} You have been timed out\n**Server:** ${message.guild.name}\n**Duration:** ${durationStr}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
          ));
          return dc;
        })()],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to timeout: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
