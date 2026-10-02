const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, AuditLogEvent, PermissionsBitField } = require('discord.js');
const GuildLogs = require('@db/guildLogs.js');
const Boost = require('@db/boostSchema.js');
const blackEmoji = require('@assets/emojis/black.js');
const { fetchConfig, isWhitelisted, punish, sendLog, getExecutor } = require('../../plugins/antinuke.js');
const { parseEmbeds } = require('@functions/embedParser.js');

const DANGEROUS_PERMS = [
  PermissionsBitField.Flags.Administrator,
  PermissionsBitField.Flags.ManageGuild,
  PermissionsBitField.Flags.ManageRoles,
  PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.BanMembers,
  PermissionsBitField.Flags.KickMembers,
  PermissionsBitField.Flags.ManageWebhooks,
];

module.exports = {
  name: 'guildMemberUpdate',
  run: async (client, oldMember, newMember) => {
    try {
      const guild = newMember.guild;
      const oldRoles = oldMember.roles.cache;
      const newRoles = newMember.roles.cache;
      const addedRoles = newRoles.filter(r => !oldRoles.has(r.id));

      if (addedRoles.size > 0) {
        const gainedDangerous = addedRoles.some(role =>
          DANGEROUS_PERMS.some(perm => role.permissions.has(perm))
        );

        if (gainedDangerous) {
          const anDoc = await fetchConfig(guild.id);
          if (anDoc && anDoc.modules?.antimemberupdate?.enabled) {
            if (newMember.id !== guild.ownerId && !(await isWhitelisted(guild.id, newMember.id, anDoc))) {
              const executor = await getExecutor(guild, AuditLogEvent.MemberRoleUpdate, newMember.id);
              if (executor && executor.id !== client.user.id && executor.id !== guild.ownerId && !(await isWhitelisted(guild.id, executor.id, anDoc))) {
                try { await newMember.roles.remove(addedRoles, 'Anti-Nuke: Dangerous permissions granted'); } catch (_) {}

                const execMember = await guild.members.fetch(executor.id).catch(() => null);
                await punish(guild, execMember, anDoc.punishment, 'Anti-Nuke: Granted dangerous permissions', client, anDoc);

                await sendLog(guild, anDoc, '\u26a0\ufe0f Anti-Nuke Triggered', {
                  Module: 'Anti-Member Update \u2014 Dangerous perms',
                  Executor: `${executor.tag} (\`${executor.id}\`)`,
                  Target: `${newMember.user.tag} (\`${newMember.id}\`)`,
                  'Roles Added': addedRoles.map(r => r.name).join(', '),
                  Action: anDoc.punishment,
                }, client);
              }
            }
          }
        }
      }
    } catch (_) {}

    try {
      if (newMember.user.bot) return;

      const logsDoc = await GuildLogs.findOne({ guildId: newMember.guild.id });
      const logChannelId = logsDoc?.channels?.members;
      if (!logChannelId) return;

      const logChannel = newMember.guild.channels.cache.get(logChannelId);
      if (!logChannel) return;

      const oldRoles = oldMember.roles.cache;
      const newRoles = newMember.roles.cache;
      const added = newRoles.filter(r => !oldRoles.has(r.id));
      const removed = oldRoles.filter(r => !newRoles.has(r.id));
      const nicknameChanged = oldMember.nickname !== newMember.nickname;
      const avatarChanged = oldMember.avatar !== newMember.avatar;
      const boostChanged = !oldMember.premiumSince && newMember.premiumSince;

      if (!added.size && !removed.size && !nicknameChanged && !avatarChanged && !boostChanged) return;

      let lines = [`# ${blackEmoji.user} Member Updated\n**User:** ${newMember.user.tag} (\`${newMember.id}\`)`];
      if (nicknameChanged) lines.push(`${blackEmoji.arrow} **Nickname:** \`${oldMember.nickname}\` \u2192 \`${newMember.nickname}\``);
      if (added.size) lines.push(`${blackEmoji.yes} **Roles Added:** ${added.map(r => `<@&${r.id}>`).join(', ')}`);
      if (removed.size) lines.push(`${blackEmoji.no} **Roles Removed:** ${removed.map(r => `<@&${r.id}>`).join(', ')}`);
      if (boostChanged) lines.push(`${blackEmoji.diamond} **Server Boost!**`);
      if (avatarChanged) lines.push(`${blackEmoji.info} **Server Avatar:** Changed`);
      lines.push(`${blackEmoji.time} <t:${Math.floor(Date.now() / 1000)}:F>`);

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));
      logChannel.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    } catch (_) {}

    try {
      const wasBoosting = !!oldMember.premiumSince;
      const isBoosting = !!newMember.premiumSince;

      if (!wasBoosting && isBoosting) {
        const boostDoc = await Boost.findOne({ guildId: newMember.guild.id, enabled: true });
        if (!boostDoc) return;

        const boostChannel = newMember.guild.channels.cache.get(boostDoc.channelId);
        if (!boostChannel || !boostChannel.isTextBased()) return;

        const placeholders = {
          user: newMember.toString(),
          username: newMember.user.username,
          usertag: newMember.user.tag,
          userid: newMember.user.id,
          useravatar: newMember.user.displayAvatarURL({ dynamic: true, size: 1024 }),
          server: newMember.guild.name,
          servericon: newMember.guild.iconURL({ dynamic: true, size: 1024 }),
          count: newMember.guild.memberCount.toString(),
          boostcount: (newMember.guild.premiumSubscriptionCount || 0).toString(),
          boosttier: (newMember.guild.premiumTier || 0).toString()
        };

        let parsed = boostDoc.message;
        for (const [key, value] of Object.entries(placeholders)) {
          parsed = parsed.replace(new RegExp(`\\{${key}\\}`, 'gi'), value);
        }

        const { text: cleanText, embeds } = await parseEmbeds(parsed, newMember.guild.id, placeholders);

        if (embeds.length > 0) {
          const sendOpts = { embeds };
          if (cleanText) sendOpts.content = cleanText;
          await boostChannel.send(sendOpts).catch(() => {});
        } else {
          const bc = new ContainerBuilder();
          bc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.diamond} Server Boosted!`));
          bc.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
          bc.addTextDisplayComponents(new TextDisplayBuilder().setContent(parsed));
          await boostChannel.send({ components: [bc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
      }
    } catch (_) {}
  },
};
