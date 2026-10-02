const { RateLimitManager } = require("@sapphire/ratelimits");
const CustomSetup = require("@db/customSetup.js");
const { parseEmbeds } = require("@functions/embedParser.js");
const Automod = require("@db/automod.js");
const Media = require("@db/media.js");
const MessageStatsModel = require("@db/messageStats.js");
const LbSettings = require("@db/lbSettings.js");
const LbBlacklist = require("@db/lbBlacklist.js");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');
const { getAfk, removeAfk } = require("@events/custom/afk.js");
const spamRateLimitManager = new RateLimitManager(10000, 7);
const cooldownRateLimitManager = new RateLimitManager(5000);
const ignoreWarnRateLimitManager = new RateLimitManager(10000);

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const INVITE_REGEX = /(discord\.(gg|io|me|li|com\/invite)|discordapp\.com\/invite)\/.+/i;
const URL_REGEX = /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/i;
const automodSpamTracker = new Map();

async function runAutomod(client, message) {
  try {
    const aioDoc = await AIO.findOne({ guildId: message.guild.id });
    if (!aioDoc?.enabled) return false;

    const doc = await Automod.findOne({ guildId: message.guild.id });
    if (!doc?.enabled) return false;

    if (message.member?.permissions?.has('ManageMessages')) return false;
    if (doc.ignoredChannels?.includes(message.channel.id)) return false;
    if (doc.ignoredRoles?.length && message.member?.roles?.cache.some(r => doc.ignoredRoles.includes(r.id))) return false;

    const content = message.content;
    let violation = null;

    if (doc.antiInvites && INVITE_REGEX.test(content)) {
      violation = 'Discord invite link detected';
    }

    if (!violation && doc.antiLinks && URL_REGEX.test(content)) {
      violation = 'External link detected';
    }

    if (!violation && doc.antiMassMention) {
      const mentionCount = (message.mentions.users?.size || 0) + (message.mentions.roles?.size || 0);
      if (mentionCount >= (doc.massMentionLimit || 5)) {
        violation = `Mass mention detected (${mentionCount} mentions)`;
      }
    }

    if (!violation && doc.antiCaps && content.length > 10) {
      const letters = content.replace(/[^a-zA-Z]/g, '');
      if (letters.length > 5) {
        const capsRatio = (letters.replace(/[^A-Z]/g, '').length / letters.length) * 100;
        if (capsRatio >= (doc.capsLimit || 70)) {
          violation = `Excessive caps detected (${Math.round(capsRatio)}%)`;
        }
      }
    }

    if (!violation && doc.antiSpam) {
      const key = `${message.guild.id}:${message.author.id}`;
      const now = Date.now();
      if (!automodSpamTracker.has(key)) automodSpamTracker.set(key, []);
      const times = automodSpamTracker.get(key).filter(t => now - t < 5000);
      times.push(now);
      automodSpamTracker.set(key, times);
      if (times.length >= 5) {
        violation = `Spam detected (${times.length} msgs in 5s)`;
        automodSpamTracker.delete(key);
      }
    }

    if (!violation) return false;

    await message.delete().catch(() => {});

    const emoji = require("@assets/emojis/black.js");
    const warnC = new ContainerBuilder();
    warnC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${emoji.warn} **${message.author.username}**, ${violation}. Your message was removed.`
    ));
    const warnMsg = await message.channel.send({ components: [warnC], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 5000);

    const punishment = doc.punishment;
    const member = message.member;
    if (member && !member.permissions.has('Administrator')) {
      try {
        if (punishment === 'mute') {
          await member.timeout(5 * 60 * 1000, `AutoMod: ${violation}`);
        } else if (punishment === 'kick') {
          await member.kick(`AutoMod: ${violation}`);
        } else if (punishment === 'ban') {
          await message.guild.members.ban(member.id, { reason: `AutoMod: ${violation}`, deleteMessageSeconds: 0 });
        }
      } catch (_) {}
    }

    if (doc.logChannelId) {
      const logCh = message.guild.channels.cache.get(doc.logChannelId);
      if (logCh && logCh.isTextBased()) {
        const lc = new ContainerBuilder();
        lc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${emoji.warn} AutoMod Violation\n` +
          `**User:** ${message.author.tag} (\`${message.author.id}\`)\n` +
          `**Channel:** <#${message.channel.id}>\n` +
          `**Violation:** ${violation}\n` +
          `**Action:** ${punishment}\n` +
          `**Message:** ${content.slice(0, 200)}\n` +
          `<t:${Math.floor(Date.now() / 1000)}:F>`
        ));
        logCh.send({ components: [lc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    }

    return true;
  } catch (_) {
    return false;
  }
}

module.exports = {
  name: "messageCreate",
  run: async (client, message) => {
    if (
      message.author.bot ||
      !message ||
      !message.guild ||
      !message.channel ||
      !message.content
    )
      return;

    if (await runAutomod(client, message)) return;

    try {
      const mediaDoc = await Media.findOne({ guildId: message.guild.id, enabled: true, channelId: message.channel.id });
      if (mediaDoc) {
        const hasMedia = message.attachments.size > 0 || /https?:\/\/\S+\.(png|jpe?g|gif|webp|mp4|mov|webm|mp3|wav|ogg)/i.test(message.content);
        if (!hasMedia) {
          const isBypassed = mediaDoc.bypassUsers?.includes(message.author.id) ||
            (mediaDoc.bypassRoles?.length && message.member?.roles?.cache.some(r => mediaDoc.bypassRoles.includes(r.id))) ||
            message.member?.permissions?.has('ManageMessages');
          if (!isBypassed) {
            await message.delete().catch(() => {});
            const mediaEmoji = require("@assets/emojis/black.js");
            const mc = new ContainerBuilder();
            mc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
              `${mediaEmoji.no} **${message.author.username}**, this is a media-only channel. Only messages with attachments or media links are allowed.`
            ));
            const mWarn = await message.channel.send({ components: [mc], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
            if (mWarn) setTimeout(() => mWarn.delete().catch(() => {}), 5000);
            return;
          }
        }
      }
    } catch (_) {}

    try {
      const lbSettings = await LbSettings.findOne({ guildId: message.guild.id });
      if (lbSettings?.messageLb) {
        const blacklisted = await LbBlacklist.findOne({
          guildId: message.guild.id,
          $or: [
            { type: 'channel', targetId: message.channel.id },
            { type: 'category', targetId: message.channel.parentId }
          ]
        });
        if (!blacklisted) {
          await MessageStatsModel.findOneAndUpdate(
            { guildId: message.guild.id, userId: message.author.id },
            { $inc: { totalMessages: 1, dailyMessages: 1, weeklyMessages: 1 } },
            { upsert: true }
          );
        }
      }
    } catch (_) {}

    // ── AFK checks ─────────────────────────────────────────────────────────────
    try {
      const userId   = message.author.id;
      const guildId  = message.guild.id;
      const afkEmoji = require("@assets/emojis/black.js");

      function fmtDuration(ms) {
        const mins = Math.floor(ms / 60000);
        if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
        if (mins > 0)   return `${mins}m`;
        return "less than a minute";
      }

      // If the message author is AFK, remove their status
      const authorAfk = await getAfk(userId, guildId);
      const activeAfk = authorAfk.global || authorAfk.server;
      if (activeAfk) {
        await removeAfk(userId, guildId);
        const timeStr = fmtDuration(Date.now() - activeAfk.timestamp);
        const scope   = activeAfk.isGlobal ? "globally" : "in this server";
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${afkEmoji.yes} Welcome back, **${message.author.username}**! Your AFK status (${scope}) has been removed.\n` +
            `${afkEmoji.time} You were away for **${timeStr}**.`
          )
        );
        message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }

      // If any mentioned users are AFK, notify in channel + DM the AFK user
      if (message.mentions.users.size > 0) {
        const afkNotices = [];
        for (const [, mentionedUser] of message.mentions.users) {
          if (mentionedUser.bot || mentionedUser.id === userId) continue;
          const { global: gAfk, server: sAfk } = await getAfk(mentionedUser.id, guildId);
          const entry = gAfk || sAfk;
          if (!entry) continue;
          const timeStr = fmtDuration(Date.now() - entry.timestamp);
          const scope   = entry.isGlobal ? "globally" : "in this server";
          afkNotices.push(
            `${afkEmoji.bell} **${mentionedUser.username}** is AFK ${scope} — *${entry.reason}* (${timeStr} ago)`
          );

          // DM the AFK user so they know they were pinged while away
          try {
            const dmContainer = new ContainerBuilder();
            dmContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${afkEmoji.bell} You were mentioned while AFK`)
            );
            dmContainer.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            dmContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `${afkEmoji.user} **Mentioned by:** ${message.author.username} (\`${message.author.id}\`)\n` +
                `${afkEmoji.server} **Server:** ${message.guild.name}\n` +
                `${afkEmoji.channel} **Channel:** #${message.channel.name}\n` +
                `${afkEmoji.link} **Jump to message:** [Click here](${message.url})\n\n` +
                `${afkEmoji.message} **Their message:**\n> ${message.content.slice(0, 500) || "*No text content*"}`
              )
            );
            await mentionedUser.send({
              components: [dmContainer],
              flags: MessageFlags.IsComponentsV2,
            }).catch(() => {});
          } catch (_) {}
        }
        if (afkNotices.length > 0) {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(afkNotices.join("\n"))
          );
          message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          }).catch(() => {});
        }
      }
    } catch (afkErr) {
      // AFK check failed silently
    }

    // Check if ping reactions are enabled for this server
    const pingReactEnabled = await client.db.premium.get(`pingreact_${message.guild.id}`) || false;

    if (pingReactEnabled) {
        client.owners.forEach(async(own) => {
          if (message.content.includes(own)) {
            await message.react("<a:AlphabetA:1355541994612588596>");
          }
        });

        // React with ADI emojis when specific user is mentioned
        if (message.content.includes("1127986938880729209")) {
          await message.react("<a:AlphabetA:1355541994612588596>");
          await message.react("<a:alphabetD:1416485770637606982>");
          await message.react("<a:ST_ALPHABETI:1355542420921520428>");
        }
        if (message.content.includes("1304080189029875753")) {
          await message.react("<:Owner:1471717806562082917>");
          await message.react("<:k_devs:1471717628501299361>");
          await message.react("<a:ST_ALPHABETI:1355542420921520428>");
          await message.react("<a:ST_ALPHABETV:1355542533060690180>");
          await message.react("<a:alphabete:1355542722320011384>");
        }
      }
   let [pfxu, pfxg, ignoredChnl, blacklistUser, owner, admin, np] =
      await Promise.all([
        await client.db.pfx.get(`${client.user.id}_${message.author.id}`),
        await client.db.pfx.get(`${client.user.id}_${message.guild.id}`),
        (await client.db.ignore.get(`${client.user.id}_${message.guild.id}`)) ||
          [],
        await client.db.blacklist.get(`${client.user.id}_${message.author.id}`),
        await client.owners.find((x) => x === message.author.id),
        await client.admins.find((x) => x === message.author.id),
          await client.db.np.get(message.author.id,)
      ]);

    if (owner || admin) blacklistUser = false;

    if (blacklistUser == "warned") return;

    if (!ignoredChnl.includes(message.channel.id) && !blacklistUser) {
      try {
        const aioDoc = await AIO.findOne({ guildId: message.guild.id });
        if (aioDoc?.enabled) {
          const Autoresponder = require("@db/autoresponder.js");
          const Autoreact = require("@db/autoreact.js");
          const msgLower = message.content.toLowerCase();

          const arDocs = await Autoresponder.find({ guildId: message.guild.id, enabled: true });
          for (const ar of arDocs) {
            const matched = ar.exactMatch
              ? msgLower === ar.trigger.toLowerCase()
              : msgLower.includes(ar.trigger.toLowerCase());
            if (matched) {
              let resp = ar.response
                .replace(/{user}/gi, message.author.toString())
                .replace(/{username}/gi, message.member?.displayName || message.author.username)
                .replace(/{server}/gi, message.guild.name)
                .replace(/{membercount}/gi, message.guild.memberCount.toString());

              const arPlaceholders = { user: message.author.toString(), username: message.member?.displayName || message.author.username, server: message.guild.name, membercount: message.guild.memberCount.toString(), count: message.guild.memberCount.toString() };
              const { text: arClean, embeds: arEmbeds } = await parseEmbeds(resp, message.guild.id, arPlaceholders);

              if (arEmbeds.length > 0) {
                const sendOpts = { embeds: arEmbeds };
                if (arClean) sendOpts.content = arClean;
                message.reply(sendOpts).catch(() => {});
              } else {
                const rc = new ContainerBuilder();
                rc.addTextDisplayComponents(new TextDisplayBuilder().setContent(resp));
                message.reply({ components: [rc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
              }
              break;
            }
          }

          const reactDocs = await Autoreact.find({ guildId: message.guild.id });
          for (const rd of reactDocs) {
            if (msgLower.includes(rd.trigger.toLowerCase())) {
              for (const em of rd.emojis) {
                await message.react(em).catch(() => {});
              }
            }
          }
        }
      } catch (_) {}
    }

    let [premiumUser] = await require(
      `@functions/msgCrt/checkPremium.js`
    )(message);

    if (message.content.toLowerCase().includes(`jsk`)) {
      client.jsk.run(message);
    }

    const emoji = require("@assets/emojis/black.js");
    const mention = new RegExp(`^<@!?${client.user.id}>( |)$`);

    if (message.content.match(mention)) {
      if (blacklistUser)
        return await client.emit("blUser", message, blacklistUser);
      
      return await client.emit("mention", message);
    }

    let prefix = client.prefix;

    if ((np) && !message.content.startsWith(client.prefix)) {
      prefix =
        (message.content.toLowerCase().startsWith(pfxu?.toLowerCase())
          ? pfxu
          : "") ||
        (message.content.toLowerCase().startsWith(pfxg?.toLowerCase())
          ? pfxg
          : "");
    }

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixes = pfxu
      ? pfxg
        ? [prefix, pfxu, pfxg]
        : [prefix, pfxu]
      : pfxg
        ? [prefix, pfxg]
        : [prefix];
    const prefixRegex = new RegExp(
      `^(<@!?${client.user.id}>|${prefixes.map(escapeRegex).join("|")})\\s*`,
      "i"
    );
    if (!prefixRegex.test(message.content.toLowerCase())) return;
    const [matchedPrefix] = message.content.toLowerCase().match(prefixRegex);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command) {
      try {
        const aioDoc = await AIO.findOne({ guildId: message.guild.id });
        if (aioDoc?.enabled) {
          const setupDoc = await CustomSetup.findOne({ guildId: message.guild.id });
          const roleEntry = setupDoc?.roles?.find(r => r.name === commandName);
          if (roleEntry) {
            const hasManagerRole = setupDoc.managerRole && message.member.roles.cache.has(setupDoc.managerRole);
            const hasManageRoles = message.member.permissions.has('ManageRoles');
            if (!hasManagerRole && !hasManageRoles) {
              const ec = new ContainerBuilder();
              const bEmoji = require("@assets/emojis/black.js");
              ec.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${bEmoji.no} You don't have permission to use this command.`));
              return message.reply({ components: [ec], flags: MessageFlags.IsComponentsV2 });
            }
            const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
            if (!member) {
              const ec = new ContainerBuilder();
              const bEmoji = require("@assets/emojis/black.js");
              ec.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${bEmoji.no} Please mention a valid member.`));
              return message.reply({ components: [ec], flags: MessageFlags.IsComponentsV2 });
            }
            const role = message.guild.roles.cache.get(roleEntry.roleId);
            if (!role) {
              const ec = new ContainerBuilder();
              const bEmoji = require("@assets/emojis/black.js");
              ec.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${bEmoji.no} The configured role no longer exists.`));
              return message.reply({ components: [ec], flags: MessageFlags.IsComponentsV2 });
            }
            const bEmoji = require("@assets/emojis/black.js");
            if (member.roles.cache.has(roleEntry.roleId)) {
              await member.roles.remove(role, `Custom role command: ${commandName}`);
              const ec = new ContainerBuilder();
              ec.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${bEmoji.yes} Removed ${role} from **${member.displayName}**.`));
              return message.reply({ components: [ec], flags: MessageFlags.IsComponentsV2 });
            } else {
              await member.roles.add(role, `Custom role command: ${commandName}`);
              const ec = new ContainerBuilder();
              ec.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${bEmoji.yes} Added ${role} to **${member.displayName}**.`));
              return message.reply({ components: [ec], flags: MessageFlags.IsComponentsV2 });
            }
          }
        }
      } catch (_) {}
      return;
    }

    if (blacklistUser) {
      return await client.emit("blUser", message, blacklistUser);
    }

    if (ignoredChnl.includes(message.channel.id) && !(admin || owner)) {
      await require(`@functions/msgCrt/ignored.js`)(
        message,
        command,
        ignoreWarnRateLimitManager
      );
      return;
    }

    if (
      !(await require(`@functions/msgCrt/cooldown.js`)(
        message,
        command,
        spamRateLimitManager,
        cooldownRateLimitManager,
        owner,
        admin
      ))
    )
      return;

    if (!(await require(`@functions/msgCrt/checkPerms.js`)(message, command)))
      return;

    if (args[0]?.toLowerCase() == "-h")
      return await client.emit("infoRequested", message, command);

    if (command.admin) {
      if (!owner && !admin)
        return;
    }

    if (command.owner && !command.admin) {
      if (!owner)
        return;
    }
      
     if (command.vote) {
         if (!(await require(`@functions/checkVote.js`)(client, message, message.author)))
             return;
     }
      
    if (command.args && !args.length) {
      return await client.emit("infoRequested", message, command);
    }

    if (!(await require(`@functions/msgCrt/checkVoice.js`)(message, command)))
      return;

    const safeEmoji = emoji;

    // Track command usage in users_data.json
    try {
      const { incrementCommandCount } = require('@utils/userData');
      incrementCommandCount(message.author.id, message.author.username);
    } catch (e) {}
    
    await command.execute(client, message, args, safeEmoji);
  },
};