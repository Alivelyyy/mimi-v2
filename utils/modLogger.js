const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const GuildLogs = require('@db/guildLogs.js');
const ModAction = require('@db/modAction.js');

const ACTION_TITLES = {
  ban: 'Member Banned',
  kick: 'Member Kicked',
  timeout: 'Member Timed Out',
  untimeout: 'Timeout Removed',
  warn: 'Member Warned',
  softban: 'Member Softbanned',
  unban: 'Member Unbanned',
  jail: 'Member Jailed',
  unjail: 'Member Unjailed',
  lock: 'Channel Locked',
  unlock: 'Channel Unlocked',
  hide: 'Channel Hidden',
  unhide: 'Channel Unhidden',
  purge: 'Messages Purged',
  slowmode: 'Slowmode Updated',
  nuke: 'Channel Nuked',
  massban: 'Mass Ban Executed'
};

async function getNextCaseId(guildId, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const last = await ModAction.findOne({ guildId }).sort({ caseId: -1 }).select('caseId').lean();
    const nextId = (last?.caseId || 0) + 1;
    try {
      return nextId;
    } catch (_) {
      continue;
    }
  }
  return Date.now();
}

async function logModAction(guild, action, data) {
  const { targetId, targetTag, moderatorId, moderatorTag, reason, duration, extra } = data;

  let caseId = 0;
  try {
    const last = await ModAction.findOne({ guildId: guild.id }).sort({ caseId: -1 }).select('caseId').lean();
    caseId = (last?.caseId || 0) + 1;

    let created = false;
    for (let attempt = 0; attempt < 3 && !created; attempt++) {
      try {
        await ModAction.create({
          guildId: guild.id,
          caseId,
          action,
          targetId: targetId || null,
          targetTag: targetTag || null,
          moderatorId,
          moderatorTag,
          reason: reason || 'No reason provided',
          duration: duration || null,
          extra: extra || null,
          timestamp: new Date()
        });
        created = true;
      } catch (err) {
        if (err.code === 11000) {
          caseId++;
        } else {
          return 0;
        }
      }
    }

    if (!created) return 0;
  } catch (_) {
    return 0;
  }

  try {
    const logsDoc = await GuildLogs.findOne({ guildId: guild.id });
    const logChannelId = logsDoc?.channels?.moderation;
    if (!logChannelId) return caseId;

    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return caseId;

    const title = ACTION_TITLES[action] || action;
    const ts = `<t:${Math.floor(Date.now() / 1000)}:F>`;

    let lines = [`# ${title}`];
    lines.push(`**Case:** #${caseId}`);

    if (targetTag && targetId) {
      lines.push(`**User:** ${targetTag} (\`${targetId}\`)`);
    }

    lines.push(`**Moderator:** ${moderatorTag}`);

    if (duration) lines.push(`**Duration:** ${duration}`);
    if (reason) lines.push(`**Reason:** ${reason}`);
    if (extra) lines.push(extra);

    lines.push(ts);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`*Case #${caseId} \u2022 ${action}*`));

    await logChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
  } catch (_) {}

  return caseId;
}

module.exports = { logModAction, ACTION_TITLES };
