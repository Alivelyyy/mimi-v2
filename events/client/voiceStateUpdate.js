const { ChannelType, PermissionsBitField, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { J2CSetting, J2CChannel } = require('@db/join2create.js');
const { buildJ2CPanel } = require('@utils/j2cPanel.js');
const VoiceStats = require('@db/voiceStats.js');
const LbSettings = require('@db/lbSettings.js');
const LbBlacklist = require('@db/lbBlacklist.js');

module.exports = {
  name: "voiceStateUpdate",
  run: async (client, oldState, newState) => {
    try {
      await handleVoiceTracking(oldState, newState);
    } catch (_) {}

    try {
      await handleVoiceLogging(oldState, newState);
    } catch (_) {}

    try {
      const guildId = newState.guild.id;

      const j2cSetting = await J2CSetting.findOne({ guildId });
      if (!j2cSetting) {
        await handleJ2CCleanup(oldState, newState);
        return;
      }

      if (newState.channelId && newState.member) {
        const bannedDoc = await J2CChannel.findOne({ channelId: newState.channelId, bannedUsers: newState.member.id });
        if (bannedDoc) {
          await newState.member.voice.disconnect('Banned from this J2C channel').catch(() => {});
          await handleJ2CCleanup(oldState, newState);
          return;
        }
      }

      if (newState.channelId === j2cSetting.triggerChannelId && newState.member) {
        const member = newState.member;
        const guild = newState.guild;
        const category = j2cSetting.categoryId
          ? guild.channels.cache.get(j2cSetting.categoryId)
          : guild.channels.cache.get(j2cSetting.triggerChannelId)?.parent;

        const existingChannel = await J2CChannel.findOne({ guildId, ownerId: member.id });
        if (existingChannel) {
          const ch = guild.channels.cache.get(existingChannel.channelId);
          if (ch) {
            await member.voice.setChannel(ch).catch(() => {});
            return;
          } else {
            await J2CChannel.deleteOne({ channelId: existingChannel.channelId });
          }
        }

        const defaultName = j2cSetting.defaultName
          .replace(/{user}/g, member.displayName)
          .replace(/{username}/g, member.user.username)
          .replace(/{tag}/g, member.user.tag)
          .replace(/{count}/g, (await J2CChannel.countDocuments({ guildId }) + 1).toString());

        const newChannel = await guild.channels.create({
          name: defaultName,
          type: ChannelType.GuildVoice,
          parent: category || null,
          userLimit: j2cSetting.defaultLimit || 0,
          bitrate: Math.min(j2cSetting.defaultBitrate || 64000, guild.maximumBitrate),
          rtcRegion: j2cSetting.defaultRegion || null,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.MoveMembers,
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.Speak
              ]
            },
            {
              id: guild.roles.everyone,
              allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel]
            }
          ]
        });

        await member.voice.setChannel(newChannel).catch(() => {});

        const j2cDoc = await J2CChannel.create({
          guildId,
          channelId: newChannel.id,
          ownerId: member.id,
          locked: false,
          hidden: false,
          bannedUsers: [],
          permittedUsers: [],
          bitrate: j2cSetting.defaultBitrate || 64000,
          region: j2cSetting.defaultRegion || null
        });

        if (j2cSetting.interfaceEnabled !== false) {
          try {
            const panelData = buildJ2CPanel(newChannel, member, j2cDoc);
            const panelMsg = await newChannel.send(panelData);
            await J2CChannel.updateOne({ channelId: newChannel.id }, { interfaceMessageId: panelMsg.id });
          } catch (err) {}
        }
      }

      await handleJ2CCleanup(oldState, newState);

    } catch (err) {}
  }
};

async function handleVoiceLogging(oldState, newState) {
  const guild = newState.guild;
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  const GuildLogs = require('@db/guildLogs.js');

  const logsDoc = await GuildLogs.findOne({ guildId: guild.id });
  const logChannelId = logsDoc?.channels?.voice;
  if (!logChannelId) return;

  const logChannel = guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  const blackEmoji = require('@assets/emojis/black.js');
  const { ContainerBuilder: CB, TextDisplayBuilder: TD, MessageFlags: MF } = require('discord.js');
  const ts = `<t:${Math.floor(Date.now() / 1000)}:F>`;
  let logText = null;

  if (!oldState.channelId && newState.channelId) {
    logText = `# ${blackEmoji.volUp} Voice Join\n**User:** ${member.user.tag} (<@${member.id}>)\n**Channel:** <#${newState.channelId}>\n${ts}`;
  } else if (oldState.channelId && !newState.channelId) {
    logText = `# ${blackEmoji.volDown} Voice Leave\n**User:** ${member.user.tag} (<@${member.id}>)\n**Channel:** <#${oldState.channelId}>\n${ts}`;
  } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    logText = `# ${blackEmoji.shuffle} Voice Switch\n**User:** ${member.user.tag} (<@${member.id}>)\n**From:** <#${oldState.channelId}>\n**To:** <#${newState.channelId}>\n${ts}`;
  } else if (oldState.serverMute !== newState.serverMute) {
    logText = `# ${blackEmoji.volDown} Server ${newState.serverMute ? 'Muted' : 'Unmuted'}\n**User:** ${member.user.tag} (<@${member.id}>)\n**Channel:** <#${newState.channelId}>\n${ts}`;
  } else if (oldState.serverDeaf !== newState.serverDeaf) {
    logText = `# ${blackEmoji.volDown} Server ${newState.serverDeaf ? 'Deafened' : 'Undeafened'}\n**User:** ${member.user.tag} (<@${member.id}>)\n**Channel:** <#${newState.channelId}>\n${ts}`;
  }

  if (logText) {
    const lc = new CB();
    lc.addTextDisplayComponents(new TD().setContent(logText));
    logChannel.send({ components: [lc], flags: MF.IsComponentsV2 }).catch(() => {});
  }
}

async function handleVoiceTracking(oldState, newState) {
  const guildId = newState.guild.id;
  const userId = newState.member?.id || oldState.member?.id;
  if (!userId) return;

  const lbSettings = await LbSettings.findOne({ guildId });
  if (!lbSettings?.voiceLb) return;

  const joinedVC = !oldState.channelId && newState.channelId;
  const leftVC = oldState.channelId && !newState.channelId;
  const switchedVC = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

  if (leftVC || switchedVC) {
    const doc = await VoiceStats.findOne({ guildId, userId });
    if (doc?.lastJoined) {
      const rawDuration = Date.now() - doc.lastJoined.getTime();
      const maxSession = 43200000;
      const duration = Math.min(rawDuration, maxSession);
      if (duration > 0 && duration < 86400000) {
        await VoiceStats.updateOne(
          { guildId, userId },
          {
            $inc: { totalTime: duration, dailyTime: duration, weeklyTime: duration },
            $set: { lastJoined: null }
          }
        );
      } else {
        await VoiceStats.updateOne(
          { guildId, userId },
          { $set: { lastJoined: null } }
        );
      }
    }
  }

  if (joinedVC || switchedVC) {
    const channelId = newState.channelId;
    const blacklisted = await LbBlacklist.findOne({
      guildId,
      $or: [
        { type: 'channel', targetId: channelId },
        { type: 'category', targetId: newState.channel?.parentId }
      ]
    });
    if (blacklisted) return;

    await VoiceStats.findOneAndUpdate(
      { guildId, userId },
      { $set: { lastJoined: new Date() } },
      { upsert: true }
    );
  }
}

async function handleJ2CCleanup(oldState, newState) {
  if (!oldState.channelId) return;
  try {
    const j2cDoc = await J2CChannel.findOne({ channelId: oldState.channelId });
    if (!j2cDoc) return;

    const channel = oldState.channel;
    if (!channel) {
      await J2CChannel.deleteOne({ channelId: oldState.channelId });
      return;
    }

    if (channel.members.size === 0) {
      await channel.delete('J2C — empty channel').catch(() => {});
      await J2CChannel.deleteOne({ channelId: oldState.channelId });
    }
  } catch (_) {}
}
