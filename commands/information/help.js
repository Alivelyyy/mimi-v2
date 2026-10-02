const {
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");
const { readdirSync, readFileSync } = require("fs");
const path = require("path");
const blackEmoji = require('@assets/emojis/black.js');

const CATEGORY_META = {
  music: { emojiKey: 'catMusic', label: 'Music', desc: 'Play, queue, and control music' },
  playlist: { emojiKey: 'catPlaylist', label: 'Playlist', desc: 'Custom playlists' },
  config: { emojiKey: 'catConfig', label: 'Config', desc: 'Bot settings and preferences' },
  filter: { emojiKey: 'catFilter', label: 'Filters', desc: 'Audio effects and filters' },
  favorites: { emojiKey: 'catFavorites', label: 'Favorites', desc: 'Save liked tracks' },
  information: { emojiKey: 'catInformation', label: 'Information', desc: 'Bot info and stats' },
  utility: { emojiKey: 'catUtility', label: 'Utility', desc: 'General tools' },
  fun: { emojiKey: 'catFun', label: 'Fun', desc: 'Fun and social commands' },
  games: { emojiKey: 'catGames', label: 'Games', desc: 'Interactive mini-games' },
  moderation: { emojiKey: 'catModeration', label: 'Moderation', desc: 'Ban, kick, mute, roles' },
  vcmod: { emojiKey: 'catVcmod', label: 'VC Mod', desc: 'Voice moderation' },
  join2create: { emojiKey: 'catJ2c', label: 'Join2Create', desc: 'Auto voice channels' },
  antinuke: { emojiKey: 'catAntinuke', label: 'Anti-Nuke', desc: 'Server protection' },
  welcome: { emojiKey: 'catWelcome', label: 'Welcome', desc: 'Welcome messages' },
  leave: { emojiKey: 'catLeave', label: 'Leave', desc: 'Leave messages' },
  boost: { emojiKey: 'catBoost', label: 'Boost', desc: 'Boost messages' },
  logs: { emojiKey: 'catLogs', label: 'Logs', desc: 'Server logging' },
  automod: { emojiKey: 'catAutomod', label: 'AutoMod', desc: 'Auto-moderation' },
  automations: { emojiKey: 'catAutomations', label: 'Automations', desc: 'Auto-role setup' },
  autoresponder: { emojiKey: 'catAutoresponder', label: 'Auto Respond', desc: 'Auto-responders' },
  custom: { emojiKey: 'catCustom', label: 'Custom Roles', desc: 'Custom role commands' },
  embed: { emojiKey: 'catEmbed', label: 'Embeds', desc: 'Custom embed builder' },
  dating: { emojiKey: 'catDating', label: 'Dating', desc: 'Dating profiles' },
  giveaway: { emojiKey: 'catGiveaway', label: 'Giveaway', desc: 'Giveaway management' },
  joindm: { emojiKey: 'catJoindm', label: 'Join DM', desc: 'DM on join' },
  leaderboard: { emojiKey: 'catLeaderboard', label: 'Leaderboard', desc: 'Rankings' },
  permit: { emojiKey: 'catPermit', label: 'Permit', desc: 'Extra owners & ignores' },
  pfp: { emojiKey: 'catPfp', label: 'PFP', desc: 'Profile pictures' },
  reactionroles: { emojiKey: 'catReactionroles', label: 'Reaction Roles', desc: 'Reaction role assign' },
  tickets: { emojiKey: 'catTickets', label: 'Tickets', desc: 'Support tickets' },
  vanityroles: { emojiKey: 'catVanityroles', label: 'Vanity Roles', desc: 'Vanity URL roles' },
  welcomer: { emojiKey: 'catWelcomer', label: 'Welcomer', desc: 'Greet system' },
};

function getMeta(cat) {
  const raw = CATEGORY_META[cat] || { emojiKey: 'files', label: cat.charAt(0).toUpperCase() + cat.slice(1), desc: `${cat} commands` };
  return { emoji: blackEmoji[raw.emojiKey] || blackEmoji.files, label: raw.label, desc: raw.desc };
}

const SUBCMD_PATTERN = /(?:action|subcommand|sub|args\[0\](?:\.toLowerCase\(\))?)\s*===?\s*['"`](\w+)['"`]/g;

function countSubcommands(category) {
  let subcmdCount = 0;
  try {
    const dir = path.join(process.cwd(), "commands", category);
    const files = readdirSync(dir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const src = readFileSync(path.join(dir, file), 'utf8');
        const matches = new Set();
        let m;
        const regex = new RegExp(SUBCMD_PATTERN.source, 'g');
        while ((m = regex.exec(src)) !== null) {
          matches.add(m[1]);
        }
        subcmdCount += matches.size;
      } catch (_) {}
    }
  } catch (_) {}
  return subcmdCount;
}

module.exports = {
  name: "help",
  aliases: ['h', 'cmds'],
  cooldown: "",
  category: "information",
  usage: "[command|category]",
  description: "Shows bot's help menu with all command categories",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const categories = readdirSync("./commands").filter(dir => dir !== "owner");
    const query = args[0]?.toLowerCase();

    if (query) {
      const cmd = client.commands.get(query) || client.commands.find(c => c.aliases?.includes(query));
      if (cmd) {
        const meta = getMeta(cmd.category);
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${meta.emoji} Command: ${cmd.name}`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

        let infoText = `${cmd.description}\n\n` +
          `**Category:** ${meta.label}\n` +
          `**Usage:** \`${client.prefix}${cmd.name} ${cmd.usage}\`\n` +
          `**Cooldown:** ${cmd.cooldown}`;

        if (cmd.aliases?.length) infoText += `\n**Aliases:** ${cmd.aliases.map(a => `\`${a}\``).join(', ')}`;
        if (cmd.userPerms?.length) infoText += `\n**Required Permissions:** ${cmd.userPerms.join(', ')}`;
        if (cmd.vote) infoText += `\n**Vote Required:** ${blackEmoji.diamond} Yes`;

        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(infoText));
        c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Requested by ${message.author.tag}`));

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('help_close').setLabel('Close').setStyle(ButtonStyle.Danger)
        );

        return message.reply({ components: [c, row], flags: MessageFlags.IsComponentsV2 });
      }

      if (categories.includes(query)) {
        const catContainer = buildCategoryContainer(client, query);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('help_close').setLabel('Close').setStyle(ButtonStyle.Danger)
        );
        return message.reply({ components: [catContainer, row], flags: MessageFlags.IsComponentsV2 });
      }

      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.warn} No command or category found for \`${query}\`.`));
      errorContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      errorContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`Use \`${client.prefix}help\` to browse available categories.`));
      return message.reply({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    const catStats = {};
    let totalCmds = 0;
    let totalSubcmds = 0;

    for (const cat of categories) {
      const cmdCount = readdirSync(`./commands/${cat}`).filter(f => f.endsWith('.js')).length;
      const subCount = countSubcommands(cat);
      catStats[cat] = { cmds: cmdCount, subs: subCount };
      totalCmds += cmdCount;
      totalSubcmds += subCount;
    }

    const PAGE_SIZE = 6;
    const pages = [];
    for (let i = 0; i < categories.length; i += PAGE_SIZE) {
      pages.push(categories.slice(i, i + PAGE_SIZE));
    }
    if (pages.length === 0) pages.push([]);

    const buildPageContainer = (pageIndex) => {
      const pageCats = pages[pageIndex] || [];
      const pageLines = pageCats.map(cat => {
        const meta = getMeta(cat);
        const { cmds, subs } = catStats[cat] || { cmds: 0, subs: 0 };
        const subLabel = subs > 0 ? ` + ${subs} sub` : '';
        return `${meta.emoji} **${meta.label}** — \`${cmds} cmds${subLabel}\``;
      });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${client.user.username} — Help`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `> Prefix: \`${client.prefix}\`\n` +
        `> ${categories.length} categories — **${totalCmds}** commands + **${totalSubcmds}** subcommands\n` +
        `> Use the buttons below to browse pages.\n\n` +
        (pageLines.length > 0 ? pageLines.join('\n') : '_No command categories available_')
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Page ${pageIndex + 1}/${pages.length}`));
      return container;
    };

    const buildCategorySelectRow = () => {
      const rows = [];
      const categoryOptions = categories.map(cat => {
        const meta = getMeta(cat);
        return {
          label: meta.label,
          value: cat,
          emoji: meta.emoji,
          description: meta.desc.slice(0, 100)
        };
      });

      if (categoryOptions.length <= 25) {
        rows.push(new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('help_category_1')
            .setPlaceholder('View module details')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(categoryOptions)
        ));
      } else {
        const firstChunk = categoryOptions.slice(0, 25);
        const secondChunk = categoryOptions.slice(25);
        rows.push(new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('help_category_1')
            .setPlaceholder('View module details')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(firstChunk)
        ));
        rows.push(new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('help_category_2')
            .setPlaceholder('More modules')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(secondChunk)
        ));
      }

      return rows;
    };

    const buildNavRow = (pageIndex) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_home').setLabel('Home').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('help_prev').setLabel('Previous').setStyle(ButtonStyle.Secondary).setDisabled(pageIndex === 0),
        new ButtonBuilder().setCustomId('help_next').setLabel('Next').setStyle(ButtonStyle.Secondary).setDisabled(pageIndex === pages.length - 1),
        new ButtonBuilder().setCustomId('help_close').setLabel('Close').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setLabel('Support').setEmoji(blackEmoji.support).setStyle(ButtonStyle.Link).setURL(client.support || 'https://discord.gg/eTneECMw4D')
      );
    };

    let pageIndex = 0;
    const reply = await message.reply({
      components: [buildPageContainer(pageIndex), ...buildCategorySelectRow(), buildNavRow(pageIndex)],
      flags: MessageFlags.IsComponentsV2,
    });

    const filter = (interaction) => {
      if (interaction.user.id !== message.author.id) {
        interaction.reply({ content: `${blackEmoji.no} Only **${message.author.username}** can use this menu.`, ephemeral: true }).catch(() => {});
        return false;
      }
      return true;
    };

    const collector = reply.createMessageComponentCollector({ filter, time: 120000, idle: 60000 });

    collector.on('collect', async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate();

      if (interaction.customId === 'help_close') {
        await reply.delete().catch(() => {});
        return;
      }

      if (interaction.customId === 'help_home') {
        pageIndex = 0;
        await reply.edit({ components: [buildPageContainer(pageIndex), ...buildCategorySelectRow(), buildNavRow(pageIndex)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        return;
      }

      if (interaction.customId === 'help_prev' && pageIndex > 0) pageIndex -= 1;
      if (interaction.customId === 'help_next' && pageIndex < pages.length - 1) pageIndex += 1;

      if (interaction.isStringSelectMenu() && interaction.customId.startsWith('help_category')) {
        const selected = interaction.values[0];
        const categoryContainer = buildCategoryContainer(client, selected);
        await reply.edit({ components: [categoryContainer, ...buildCategorySelectRow(), buildNavRow(pageIndex)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        return;
      }

      await reply.edit({ components: [buildPageContainer(pageIndex), ...buildCategorySelectRow(), buildNavRow(pageIndex)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector.on('end', async () => {
      await reply.edit({ components: [] }).catch(() => {});
    });
  },
};

function buildCategoryContainer(client, category) {
  const meta = getMeta(category);
  const cmds = client.commands.filter(x => x.category === category);
  const subCount = countSubcommands(category);

  const cmdList = cmds.map(x =>
    `\`${client.prefix}${x.name}\` — ${(x.description).slice(0, 45)}`
  ).join('\n');

  const subLabel = subCount > 0 ? ` • ${subCount} subcommands` : '';

  const c = new ContainerBuilder();
  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`# ${client.user.username} — ${meta.label}`)
  );
  c.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );
  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `> ${meta.desc}\n\n` +
      (cmdList.length > 3900 ? cmdList.slice(0, 3900) + '\n...' : cmdList) +
      `\n\n*Use \`${client.prefix}help <command>\` for detailed info*`
    )
  );
  c.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );
  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${cmds.size} commands${subLabel} in ${meta.label}`)
  );

  return c;
}
