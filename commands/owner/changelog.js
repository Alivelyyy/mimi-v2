const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

const CHANGELOGS = [
  {
    version: "v6.1.0",
    date: "March 2026",
    pages: [
      {
        title: "What's New",
        content: [
          `**Media-Only Channels** — Enforce media-only in any channel with bypass support`,
          `**Emoji Centralization** — All emojis now use a single source for consistency`,
          `**Leaderboard Improvements** — Better pagination, medals, stats cards`,
          `**Codebase Cleanup** — Removed presence system, improved stability`,
          `-# Improved`,
          `**Music Commands** — Cleaner play, skip, pause, resume, stop`,
          `**Voice Tracking** — Streamlined voice state handling`,
          `**AutoMod Logging** — Better formatting and emoji consistency`,
          `-# Fixed`,
          `**Fun Commands** — Fixed missing emoji imports causing crashes`,
          `**Leaderboard Display** — Fixed raw emoji rendering in rankings`,
          `**Media Bypass** — Fixed empty list display and missing feedback`,
        ],
      },
    ],
  },
  {
    version: "v6.0.0",
    date: "February 2026",
    pages: [
      {
        title: "What's New (1/2)",
        content: [
          `**14 New AIO Categories** — automod, automations, autoresponder, customroles, dating, giveaway, joindm, leaderboard, permit, pfp, reactionroles, tickets, vanityroles, welcomer`,
          `**Tickets** — Panels, staff, categories, transcripts`,
          `**Giveaways** — Start, end, reroll, restart-safe`,
          `**Dating** — Profiles, matching, likes, stats`,
          `**Leaderboard** — Voice, message, invite rankings`,
          `**Reaction Roles** — Add, list, manage on any message`,
          `**Custom Roles** — Staff, girl, friend, VIP, guest`,
          `**AutoMod** — Auto-mod with punishments, anti-bot`,
          `**Jail** — Jail/unjail with role backup`,
          `**Vanity Roles** — Auto-assign for vanity URL`,
        ],
      },
      {
        title: "What's New (2/2)",
        content: [
          `**Join DM** — Auto-DM new members`,
          `**Welcomer** — Greet system with auto-delete`,
          `**Logging** — Auto-setup for 6 log types`,
          `**Permit** — Extra owner & ignore system`,
          `**Mass Mod** — hideall, lockall, unbanall, nuke`,
          `**Role Mgmt** — Create, delete, mass assign`,
          `**Fun** — 13 new commands including tictactoe`,
          `**PFP** — Profile pics by category`,
          `**List** — Boosters, inrole, emojis, admins`,
          `**26 DB Schemas** — MongoDB for all systems`,
        ],
      },
      {
        title: "Improved & Fixed",
        content: [
          `**Help Menu** — Redesigned with command lookup`,
          `**Changelog** — Paginated version history`,
          `**AIO** — Expanded to 22 gated categories`,
          `**Anti-Nuke** — Mainrole, limits, punishments`,
          `**Components V2** — Modern UI for all commands`,
          `-# Bug Fixes`,
          `**Giveaway Durability** — Survives restarts`,
          `**Command Conflicts** — Fixed fun/games dupes`,
          `**Alias Conflicts** — Fixed echo collision`,
        ],
      },
    ],
  },
  {
    version: "v3.2",
    date: "January 2026",
    pages: [
      {
        title: "Changes",
        content: [
          `**Games** — truth, dare, gtn, scramble, trivia, wyr, 8ball`,
          `**Lavalink** — 30s health monitor, auto-reconnect`,
          `-# Improved`,
          `**AFK** — Migrated to MongoDB`,
          `**Lavalink** — 20 retries with session resuming`,
          `-# Fixed`,
          `**AFK Crash** — Data now in MongoDB`,
          `**Reconnection** — Fixed no-reconnect after drops`,
          `**Reload** — Fixed music after reload`,
        ],
      },
    ],
  },
];

function getTotalPages() {
  let total = 0;
  for (const log of CHANGELOGS) total += log.pages.length;
  return total;
}

function getPageData(pageIndex) {
  let idx = 0;
  for (const log of CHANGELOGS) {
    for (const page of log.pages) {
      if (idx === pageIndex) return { log, page };
      idx++;
    }
  }
  return null;
}

function buildPage(client, pageIndex) {
  const totalPages = getTotalPages();
  const data = getPageData(pageIndex);
  if (!data) return new ContainerBuilder();

  const { log, page } = data;
  const container = new ContainerBuilder();

  const items = page.content.map(item => {
    if (item.startsWith('-#')) return item;
    return `${blackEmoji.arrow} ${item}`;
  }).join('\n');

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${blackEmoji.bell} ${client.user.username} ${log.version}\n` +
      `*${log.date}* — ${page.title}\n\n` +
      items +
      `\n\n${blackEmoji.info} Page ${pageIndex + 1}/${totalPages}`
    )
  );

  return container;
}

module.exports = {
  name: "changelog",
  aliases: ['cl2', 'changes'],
  cooldown: "10",
  category: "owner",
  usage: "[broadcast]",
  description: "View or broadcast the latest changelog",
  args: false,
  owner: true,
  admin: false,
  botPerms: ["SendMessages"],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,

  execute: async (client, message, args) => {
    try {
      const isBroadcast = args[0]?.toLowerCase() === 'broadcast';
      const totalPages = getTotalPages();

      if (isBroadcast) {
        const previewContainer = new ContainerBuilder();
        previewContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ${blackEmoji.warn} Broadcast Changelog\n` +
            `${blackEmoji.server} **Target:** ${client.guilds.cache.size} servers\n` +
            `${blackEmoji.arrow} Version: **${CHANGELOGS[0].version}**\n` +
            `${blackEmoji.warn} This will send the changelog to every server.`
          )
        );
        previewContainer.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("cl_confirm").setLabel("Broadcast Now").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("cl_cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger)
          )
        );

        const confirmMsg = await message.reply({
          components: [previewContainer],
          flags: MessageFlags.IsComponentsV2,
        });

        let interaction;
        try {
          interaction = await confirmMsg.awaitMessageComponent({
            filter: (i) => i.user.id === message.author.id,
            time: 60000,
            componentType: ComponentType.Button,
          });
        } catch {
          const tc = new ContainerBuilder();
          tc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Broadcast timed out.`));
          return confirmMsg.edit({ components: [tc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }

        if (interaction.customId === "cl_cancel") {
          const cc = new ContainerBuilder();
          cc.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Broadcast cancelled.`));
          return interaction.update({ components: [cc], flags: MessageFlags.IsComponentsV2 });
        }

        const bc = new ContainerBuilder();
        bc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.loading} Broadcasting to **${client.guilds.cache.size}** servers...`
        ));
        await interaction.update({ components: [bc], flags: MessageFlags.IsComponentsV2 });

        let sent = 0, failed = 0;
        const firstPage = buildPage(client, 0);

        for (const [, guild] of client.guilds.cache) {
          try {
            const channel =
              (guild.systemChannel?.permissionsFor(guild.members.me)?.has(["SendMessages", "ViewChannel"])
                ? guild.systemChannel : null) ||
              guild.channels.cache.find(ch =>
                ch.type === 0 && ch.permissionsFor(guild.members.me)?.has(["SendMessages", "ViewChannel"])
              );
            if (!channel) { failed++; continue; }
            await channel.send({ components: [firstPage], flags: MessageFlags.IsComponentsV2 });
            sent++;
            await new Promise(r => setTimeout(r, 300));
          } catch { failed++; }
        }

        const dc = new ContainerBuilder();
        dc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `# ${blackEmoji.yes} Broadcast Complete\n` +
          `${blackEmoji.yes} **Sent:** ${sent} servers\n` +
          `${blackEmoji.no} **Failed:** ${failed} servers`
        ));
        return confirmMsg.edit({ components: [dc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }

      let currentPage = 0;

      const makeNavRow = (page) => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("cl_prev").setEmoji(blackEmoji.previous).setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId("cl_next").setEmoji(blackEmoji.skip).setLabel("Next").setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1),
        new ButtonBuilder().setLabel("Support").setEmoji(blackEmoji.support).setStyle(ButtonStyle.Link).setURL(client.support || "https://discord.gg/eTneECMw4D"),
        new ButtonBuilder().setLabel("Vote").setEmoji(blackEmoji.star).setStyle(ButtonStyle.Link).setURL(client.vote || `https://top.gg/bot/${client.user.id}/vote`)
      );

      const page = buildPage(client, 0);
      page.addActionRowComponents(makeNavRow(0));

      const m = await message.reply({ components: [page], flags: MessageFlags.IsComponentsV2 });

      if (totalPages <= 1) return;

      const collector = m.createMessageComponentCollector({
        filter: async (i) => {
          if (i.user.id === message.author.id) return true;
          await i.reply({ content: `${blackEmoji.no} Only **${message.author.username}** can use this.`, ephemeral: true }).catch(() => {});
          return false;
        },
        time: 120000,
        idle: 60000,
        componentType: ComponentType.Button,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "cl_prev" && currentPage > 0) currentPage--;
        if (interaction.customId === "cl_next" && currentPage < totalPages - 1) currentPage++;

        const newPage = buildPage(client, currentPage);
        newPage.addActionRowComponents(makeNavRow(currentPage));
        await interaction.update({ components: [newPage], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      });

      collector.on("end", async () => {
        await m.edit({ components: [] }).catch(() => {});
      });

    } catch (error) {
      console.error("Changelog Error:", error);
      const ec = new ContainerBuilder();
      ec.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.no} An error occurred: ${error.message}`
      ));
      return message.reply({ components: [ec], flags: MessageFlags.IsComponentsV2 });
    }
  },
};
