const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionsBitField, AuditLogEvent } = require('discord.js');
const Antinuke = require('@db/antinuke.js');
const AdminList = require('@db/adminList.js');

const actionTracker = new Map();
const WINDOW_MS = 10_000;

function track(guildId, userId, actionType) {
  const key = `${guildId}:${userId}:${actionType}`;
  const now = Date.now();
  if (!actionTracker.has(key)) actionTracker.set(key, []);
  const times = actionTracker.get(key).filter(t => now - t < WINDOW_MS);
  times.push(now);
  actionTracker.set(key, times);
  setTimeout(() => {
    const cur = actionTracker.get(key);
    if (cur) {
      const cleaned = cur.filter(t => Date.now() - t < WINDOW_MS);
      if (cleaned.length === 0) actionTracker.delete(key);
      else actionTracker.set(key, cleaned);
    }
  }, WINDOW_MS + 500);
  return times.length;
}

function resetTracker(guildId, userId, actionType) {
  actionTracker.delete(`${guildId}:${userId}:${actionType}`);
}

async function fetchConfig(guildId) {
  const anDoc = await Antinuke.findOne({ guildId });
  if (!anDoc?.enabled) return null;

  if (anDoc.actions && !anDoc.modules?.antiban) {
    const a = anDoc.actions;
    const migrated = {
      punishment: a.punishment || anDoc.punishment || 'ban',
      'modules.antiban.limit': a.banLimit || 3,
      'modules.antikick.limit': a.kickLimit || 3,
      'modules.antichanneldelete.limit': a.channelDeleteLimit || 3,
      'modules.antiroledelete.limit': a.roleDeleteLimit || 3,
      'modules.antiwebhook.limit': a.webhookLimit || 3,
      updatedAt: new Date(),
    };
    await Antinuke.findOneAndUpdate({ guildId }, { $set: migrated, $unset: { actions: '' } });
    const fresh = await Antinuke.findOne({ guildId });
    return fresh;
  }

  return anDoc;
}

async function isWhitelisted(guildId, userId, anDoc) {
  if (anDoc.whitelist.includes(userId)) return true;
  try {
    const adminDoc = await AdminList.findOne({ guildId });
    if (adminDoc?.admins?.includes(userId)) return true;
  } catch (_) {}
  return false;
}

function canPunish(guild, member, client) {
  if (!member) return false;
  if (member.id === guild.ownerId) return false;
  if (!member.manageable) return false;
  const botMember = guild.members.me;
  if (!botMember) return false;
  if (member.roles.highest.position >= botMember.roles.highest.position) return false;
  return true;
}

async function punish(guild, member, punishment, reason, client, anDoc) {
  if (!member || !canPunish(guild, member, client)) return false;
  try {
    if (punishment === 'ban') {
      await guild.members.ban(member.id, { reason, deleteMessageSeconds: 0 });
    } else if (punishment === 'kick') {
      await member.kick(reason);
    } else if (punishment === 'strip') {
      const roles = member.roles.cache.filter(r => r.id !== guild.id && r.editable);
      if (roles.size > 0) await member.roles.remove(roles, reason);
    } else if (punishment === 'quarantine') {
      if (anDoc?.quarantineRoleId) {
        const qRole = guild.roles.cache.get(anDoc.quarantineRoleId);
        if (qRole) {
          const roles = member.roles.cache.filter(r => r.id !== guild.id && r.editable);
          if (roles.size > 0) await member.roles.remove(roles, reason);
          await member.roles.add(qRole, reason);
        } else {
          await guild.members.ban(member.id, { reason: reason + ' (quarantine role missing, banned instead)', deleteMessageSeconds: 0 });
        }
      } else {
        await guild.members.ban(member.id, { reason: reason + ' (no quarantine role, banned instead)', deleteMessageSeconds: 0 });
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}

async function sendLog(guild, anDoc, title, fields, client) {
  const channelId = anDoc?.logChannelId;
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) return;
  try {
    const fieldText = Object.entries(fields).map(([k, v]) => `**${k}:** ${v}`).join('\n');
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `# ${title}\n${fieldText}\n<t:${Math.floor(Date.now() / 1000)}:F>`
    ));
    await channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
  } catch (_) {}
}

async function getExecutor(guild, auditType, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type: auditType, limit: 5 });
    const entry = logs.entries.find(e => {
      if (Date.now() - e.createdTimestamp > 5000) return false;
      if (targetId && e.target?.id !== targetId) return false;
      return true;
    });
    return entry?.executor || null;
  } catch (_) {
    return null;
  }
}

async function handleAction(client, guild, auditType, moduleName, actionLabel, targetId) {
  const anDoc = await fetchConfig(guild.id);
  if (!anDoc) return;
  const mod = anDoc.modules?.[moduleName];
  if (!mod?.enabled) return;

  const executor = await getExecutor(guild, auditType, targetId);
  if (!executor) return;
  if (executor.id === client.user.id) return;
  if (executor.id === guild.ownerId) return;
  if (await isWhitelisted(guild.id, executor.id, anDoc)) return;

  const limit = mod.limit || 3;
  const count = track(guild.id, executor.id, moduleName);
  if (count < limit) return;

  resetTracker(guild.id, executor.id, moduleName);

  const execMember = await guild.members.fetch(executor.id).catch(() => null);
  const punished = await punish(guild, execMember, anDoc.punishment, `Anti-Nuke: ${actionLabel}`, client, anDoc);

  await sendLog(guild, anDoc, '\u26a0\ufe0f Anti-Nuke Triggered', {
    Module: actionLabel,
    User: `${executor.tag} (\`${executor.id}\`)`,
    Threshold: `${count}/${limit} in ${WINDOW_MS / 1000}s`,
    Action: punished ? anDoc.punishment : 'Failed (insufficient perms)',
  }, client);
}

async function handleToggleAction(client, guild, auditType, moduleName, actionLabel, targetId) {
  const anDoc = await fetchConfig(guild.id);
  if (!anDoc) return;
  const mod = anDoc.modules?.[moduleName];
  if (!mod?.enabled) return;

  const executor = await getExecutor(guild, auditType, targetId);
  if (!executor) return;
  if (executor.id === client.user.id) return;
  if (executor.id === guild.ownerId) return;
  if (await isWhitelisted(guild.id, executor.id, anDoc)) return;

  const execMember = await guild.members.fetch(executor.id).catch(() => null);
  const punished = await punish(guild, execMember, anDoc.punishment, `Anti-Nuke: ${actionLabel}`, client, anDoc);

  await sendLog(guild, anDoc, '\u26a0\ufe0f Anti-Nuke Triggered', {
    Module: actionLabel,
    User: `${executor.tag} (\`${executor.id}\`)`,
    Action: punished ? anDoc.punishment : 'Failed (insufficient perms)',
  }, client);
}

const MODULE_INFO = {
  antiban: { label: 'Anti-Ban', desc: 'Detects mass banning', hasLimit: true },
  antikick: { label: 'Anti-Kick', desc: 'Detects mass kicking', hasLimit: true },
  antichanneldelete: { label: 'Anti-Channel Delete', desc: 'Detects mass channel deletion', hasLimit: true },
  antichannelcreate: { label: 'Anti-Channel Create', desc: 'Detects mass channel creation', hasLimit: true },
  antiroledelete: { label: 'Anti-Role Delete', desc: 'Detects mass role deletion', hasLimit: true },
  antirolecreate: { label: 'Anti-Role Create', desc: 'Detects mass role creation', hasLimit: true },
  antiwebhook: { label: 'Anti-Webhook', desc: 'Detects mass webhook creation', hasLimit: true },
  antibot: { label: 'Anti-Bot', desc: 'Blocks unauthorized bot additions', hasLimit: false },
  antiserverupdate: { label: 'Anti-Server Update', desc: 'Blocks server name/icon changes', hasLimit: false },
  antimemberupdate: { label: 'Anti-Member Update', desc: 'Blocks granting dangerous perms', hasLimit: false },
  antiemoji: { label: 'Anti-Emoji', desc: 'Detects mass emoji deletion', hasLimit: true },
  antiprune: { label: 'Anti-Prune', desc: 'Blocks mass member prune', hasLimit: false },
};

module.exports = {
  track,
  resetTracker,
  fetchConfig,
  isWhitelisted,
  canPunish,
  punish,
  sendLog,
  getExecutor,
  handleAction,
  handleToggleAction,
  MODULE_INFO,
  WINDOW_MS,
};
