const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  AuditLogEvent,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Welcome = require('@db/welcomeSchema.js');
const Greet = require('@db/greet.js');
const JoinDM = require('@db/joindm.js');
const { parseEmbeds } = require('@functions/embedParser.js');
const Antibot = require('@db/antibot.js');
const Autorole = require('@db/autorole.js');
const { fetchConfig, isWhitelisted, punish, sendLog, getExecutor } = require('../../plugins/antinuke.js');
const InviteTracker = require('@db/inviteTracker.js');
const LbSettings = require('@db/lbSettings.js');

module.exports = {
  name: "guildMemberAdd",
  run: async (client, member) => {
    try {
      if (member.user.bot) {
        try {
          const guild = member.guild;
          const anDoc = await fetchConfig(guild.id);
          if (anDoc && anDoc.modules?.antibot?.enabled) {
            const executor = await getExecutor(guild, AuditLogEvent.BotAdd, member.id);
            if (executor && executor.id !== client.user.id && executor.id !== guild.ownerId) {
              if (!(await isWhitelisted(guild.id, executor.id, anDoc))) {
                await member.kick('Anti-Nuke: Unauthorized bot addition').catch(() => {});
                const execMember = await guild.members.fetch(executor.id).catch(() => null);
                await punish(guild, execMember, anDoc.punishment, 'Anti-Nuke: Added unauthorized bot', client, anDoc);
                await sendLog(guild, anDoc, '\u26a0\ufe0f Anti-Nuke Triggered', {
                  Module: 'Anti-Bot — Unauthorized bot added',
                  Executor: `${executor.tag} (\`${executor.id}\`)`,
                  Bot: `${member.user.tag} (\`${member.id}\`)`,
                  Action: `Bot kicked + executor ${anDoc.punishment}`,
                }, client);
                return;
              }
            }
          }
        } catch (_) {}

        try {
          const abDoc = await Antibot.findOne({ guildId: member.guild.id });
          if (abDoc?.enabled) {
            if (member.id !== client.user.id && !abDoc.whitelist?.includes(member.id)) {
              const action = abDoc.action;
              let removed = false;
              if (action === 'ban') {
                removed = await member.guild.members.ban(member.id, { reason: 'Anti-Bot: Unauthorized bot' }).then(() => true).catch(() => false);
              } else {
                removed = await member.kick('Anti-Bot: Unauthorized bot').then(() => true).catch(() => false);
              }
              if (removed) return;
            }
          }
        } catch (_) {}

        try {
          const arDoc = await Autorole.findOne({ guildId: member.guild.id });
          if (arDoc?.enabled !== false && arDoc?.botRoles?.length) {
            for (const roleId of arDoc.botRoles) {
              const role = member.guild.roles.cache.get(roleId);
              if (role && role.editable) await member.roles.add(role, 'Autorole: Bot join').catch(() => {});
            }
          }
        } catch (_) {}
        return;
      }

      try {
        const arDoc = await Autorole.findOne({ guildId: member.guild.id });
        if (arDoc?.enabled !== false && arDoc?.humanRoles?.length) {
          for (const roleId of arDoc.humanRoles) {
            const role = member.guild.roles.cache.get(roleId);
            if (role && role.editable) await member.roles.add(role, 'Autorole: Human join').catch(() => {});
          }
        }
      } catch (_) {}

      // ── Join DM ─────────────────────────────────────────────────────────
      try {
        const joindmDoc = await JoinDM.findOne({ guildId: member.guild.id, enabled: true });
        if (joindmDoc && joindmDoc.message) {
          const dmPlaceholders = { user: member.toString(), username: member.user.username, server: member.guild.name, count: member.guild.memberCount.toString() };
          const dmParsed = joindmDoc.message
            .replace(/{user}/g, dmPlaceholders.user)
            .replace(/{username}/g, dmPlaceholders.username)
            .replace(/{server}/g, dmPlaceholders.server)
            .replace(/{count}/g, dmPlaceholders.count);

          const { text: dmClean, embeds: dmEmbeds } = await parseEmbeds(dmParsed, member.guild.id, dmPlaceholders);

          if (dmEmbeds.length > 0) {
            const sendOpts = { embeds: dmEmbeds };
            if (dmClean) sendOpts.content = dmClean;
            await member.user.send(sendOpts).catch(() => {});
          } else {
            const dmContainer = new ContainerBuilder();
            dmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(dmParsed));
            await member.user.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
          }
        } else {
          const prefix = client.prefix;
          const botName = client.user.username;
          const guildName = member.guild.name;
          const supportURL = client.support || "https://discord.gg/eTneECMw4D";
          const inviteURL = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
          const voteURL = client.vote || `https://top.gg/bot/${client.user.id}/vote`;

          const container = new ContainerBuilder();
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.heart} Welcome to ${guildName}!`));
          container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `Hey **${member.user.username}**! ${blackEmoji.point}\n\n` +
            `I'm **${botName}**, the music bot powering **${guildName}**.\n` +
            `Here's a quick look at what I bring to the table:`
          ));
          container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${blackEmoji.music} Stream from **YouTube, Spotify, SoundCloud** & more\n` +
            `${blackEmoji.filter} **Audio filters** — bass boost, nightcore, reverb & more\n` +
            `${blackEmoji.playlist} **Personal playlists** — save, manage & share your music\n` +
            `${blackEmoji.diamond} **Premium perks** for the ultimate listening experience\n` +
            `${blackEmoji["247"]} Available **24/7** — always here when you need music`
          ));
          container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} Jump into a voice channel and run \`${prefix}play\` to get started!\n` +
            `${blackEmoji.info} Use \`${prefix}help\` to explore all my commands.`
          ));
          container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
          container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setLabel("Invite Me").setEmoji(blackEmoji.link).setStyle(ButtonStyle.Link).setURL(inviteURL),
              new ButtonBuilder().setLabel("Support").setEmoji(blackEmoji.support).setStyle(ButtonStyle.Link).setURL(supportURL),
              new ButtonBuilder().setLabel("Vote").setEmoji(blackEmoji.vote).setStyle(ButtonStyle.Link).setURL(voteURL)
            )
          );
          container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`*Developed with ${blackEmoji.heart} by ApeX Devs*`));
          await member.user.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
      } catch (_) {}

      // ── Welcome message ──────────────────────────────────────────────
      try {
        const welcomeDoc = await Welcome.findOne({ guildId: member.guild.id, enabled: true });
        if (welcomeDoc) {
          const wChannel = member.guild.channels.cache.get(welcomeDoc.channelId);
          if (wChannel && wChannel.isTextBased()) {
            const placeholders = { user: member.toString(), username: member.user.username, server: member.guild.name, count: member.guild.memberCount.toString() };
            const parsed = welcomeDoc.message
              .replace(/{user}/g, placeholders.user)
              .replace(/{username}/g, placeholders.username)
              .replace(/{server}/g, placeholders.server)
              .replace(/{count}/g, placeholders.count);

            const { text: cleanText, embeds } = await parseEmbeds(parsed, member.guild.id, placeholders);

            if (embeds.length > 0) {
              const sendOpts = { embeds };
              if (cleanText) sendOpts.content = cleanText;
              await wChannel.send(sendOpts).catch(() => {});
            } else {
              const wContainer = new ContainerBuilder();
              wContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.bell} Welcome!`));
              wContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
              wContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(parsed));
              await wChannel.send({ components: [wContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }
          }
        }
      } catch (_) {}

      // ── Greet / Welcomer message ────────────────────────────────────────
      try {
        const greetDoc = await Greet.findOne({ guildId: member.guild.id, enabled: true });
        if (greetDoc && greetDoc.channelId) {
          const gChannel = member.guild.channels.cache.get(greetDoc.channelId);
          if (gChannel && gChannel.isTextBased()) {
            const placeholders = { user: member.toString(), username: member.user.username, server: member.guild.name, count: member.guild.memberCount.toString() };
            const parsed = (greetDoc.message)
              .replace(/{user}/g, placeholders.user)
              .replace(/{username}/g, placeholders.username)
              .replace(/{server}/g, placeholders.server)
              .replace(/{count}/g, placeholders.count);

            const { text: cleanText, embeds } = await parseEmbeds(parsed, member.guild.id, placeholders);
            let greetMsg;

            if (embeds.length > 0) {
              const sendOpts = { embeds };
              if (cleanText) sendOpts.content = cleanText;
              greetMsg = await gChannel.send(sendOpts).catch(() => null);
            } else {
              const gContainer = new ContainerBuilder();
              gContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.bell} Welcome!`));
              gContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
              gContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(parsed));
              greetMsg = await gChannel.send({ components: [gContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
            }

            if (greetMsg && greetDoc.autoDelete > 0) {
              setTimeout(() => greetMsg.delete().catch(() => {}), greetDoc.autoDelete * 1000);
            }
          }
        }
      } catch (_) {}

      // ── Joins Log ─────────────────────────────────────────────────────────
      try {
        const aioDoc2 = await AIO.findOne({ guildId: member.guild.id });
        if (aioDoc2?.enabled) {
          const GuildLogs = require('@db/guildLogs.js');
          const logsDoc = await GuildLogs.findOne({ guildId: member.guild.id });
          const logChannelId = logsDoc?.channels?.joins;
          if (logChannelId) {
            const logChannel = member.guild.channels.cache.get(logChannelId);
            if (logChannel) {
              const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);
              const lc = new ContainerBuilder();
              lc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `# ${blackEmoji.inbox} Member Joined\n` +
                `**User:** ${member.user.tag} (<@${member.id}>)\n` +
                `**ID:** \`${member.id}\`\n` +
                `**Account Age:** ${accountAge} days\n` +
                `**Member Count:** ${member.guild.memberCount}\n` +
                `<t:${Math.floor(Date.now() / 1000)}:F>`
              ));
              logChannel.send({ components: [lc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }
          }
        }
      } catch (_) {}

      // ── Invite Tracking ────────────────────────────────────────────────────
      try {
        const lbSettings = await LbSettings.findOne({ guildId: member.guild.id });
        if (lbSettings?.inviteLb) {
          const cachedInvites = client.inviteCache?.get(member.guild.id);
          const currentInvites = await member.guild.invites.fetch();

          let inviterId = null;

          if (cachedInvites) {
            const usedInvite = currentInvites.find(inv => {
              const cached = cachedInvites.get(inv.code);
              return cached && inv.uses > cached.uses;
            });
            if (usedInvite?.inviter) {
              inviterId = usedInvite.inviter.id;
            }
          }

          const newCache = new Map();
          currentInvites.forEach(inv => newCache.set(inv.code, { uses: inv.uses, inviterId: inv.inviter?.id }));
          if (!client.inviteCache) client.inviteCache = new Map();
          client.inviteCache.set(member.guild.id, newCache);

          if (inviterId && inviterId !== member.id) {
            const accountAge = Date.now() - member.user.createdTimestamp;
            const isFake = accountAge < (lbSettings.altThreshold || 604800000);

            await InviteTracker.findOneAndUpdate(
              { guildId: member.guild.id, userId: inviterId },
              {
                $inc: {
                  totalInvites: isFake ? 0 : 1,
                  regularInvites: isFake ? 0 : 1,
                  fakeInvites: isFake ? 1 : 0
                },
                $addToSet: { invitedUsers: member.id }
              },
              { upsert: true }
            );

            await InviteTracker.findOneAndUpdate(
              { guildId: member.guild.id, userId: member.id },
              { $set: { invitedBy: inviterId } },
              { upsert: true }
            );
          }
        }
      } catch (_) {}

    } catch (error) {
      console.error("Error in guildMemberAdd event:", error);
    }
  }
};
