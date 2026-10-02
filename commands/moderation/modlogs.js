const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const ModAction = require('@db/modAction.js');
const { ACTION_TITLES } = require('@utils/modLogger.js');

module.exports = {
  name: 'modlogs',
  aliases: ['ml', 'modlog'],
  cooldown: '',
  category: 'moderation',
  usage: '[@user|caseId]',
  description: 'View moderation history for a user or a specific case',
  args: false,
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
    const arg = args[0];

    if (arg && /^\d+$/.test(arg) && !arg.startsWith('<')) {
      const caseId = parseInt(arg);
      const modCase = await ModAction.findOne({ guildId: message.guild.id, caseId });

      if (!modCase) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Case **#${caseId}** not found.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Case #${caseId}`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      const ts = Math.floor(new Date(modCase.timestamp).getTime() / 1000);
      let details = [
        `${blackEmoji.arrow} **Action:** ${ACTION_TITLES[modCase.action] || modCase.action}`,
        `${blackEmoji.mod} **Moderator:** ${modCase.moderatorTag}`,
      ];
      if (modCase.targetTag) details.push(`${blackEmoji.user} **Target:** ${modCase.targetTag} (\`${modCase.targetId}\`)`);
      if (modCase.reason) details.push(`${blackEmoji.info} **Reason:** ${modCase.reason}`);
      if (modCase.duration) details.push(`${blackEmoji.time} **Duration:** ${modCase.duration}`);
      if (modCase.extra) details.push(modCase.extra);
      details.push(`${blackEmoji.time} <t:${ts}:F> (<t:${ts}:R>)`);

      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(details.join('\n')));
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const target = message.mentions.users.first() || (arg ? await client.users.fetch(arg).catch(() => null) : null);

    const query = { guildId: message.guild.id };
    let title = `${message.guild.name}`;

    if (target) {
      query.targetId = target.id;
      title = target.tag;
    }

    const totalCases = await ModAction.countDocuments(query);

    if (totalCases === 0) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.info} No moderation logs found${target ? ` for **${target.tag}**` : ''}.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const perPage = 8;
    let page = 0;
    const totalPages = Math.ceil(totalCases / perPage);

    async function buildPage(p) {
      const cases = await ModAction.find(query)
        .sort({ caseId: -1 })
        .skip(p * perPage)
        .limit(perPage)
        .lean();

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Moderation Logs \u2014 ${title}`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Total Cases:** ${totalCases}`));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

      const lines = cases.map(c => {
        const ts = Math.floor(new Date(c.timestamp).getTime() / 1000);
        const actionLabel = ACTION_TITLES[c.action] || c.action;
        const targetPart = c.targetTag ? ` \u2022 ${c.targetTag}` : '';
        return `**#${c.caseId}** ${actionLabel}${targetPart}\n${blackEmoji.arrow} ${c.reason?.slice(0, 80)} \u2022 <t:${ts}:R>`;
      });

      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n\n')));
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`*Page ${p + 1}/${totalPages} \u2022 Use \`${client.prefix}modlogs <caseId>\` for details*`));

      if (totalPages > 1) {
        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('ml_prev')
              .setLabel('\u25C0 Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(p === 0),
            new ButtonBuilder()
              .setCustomId('ml_next')
              .setLabel('Next \u25B6')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(p >= totalPages - 1)
          )
        );
      }

      return container;
    }

    const msg = await message.reply({ components: [await buildPage(page)], flags: MessageFlags.IsComponentsV2 });

    if (totalPages <= 1) return;

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id && ['ml_prev', 'ml_next'].includes(i.customId),
      time: 120000
    });

    collector.on('collect', async i => {
      await i.deferUpdate().catch(() => {});
      if (i.customId === 'ml_next' && page < totalPages - 1) page++;
      if (i.customId === 'ml_prev' && page > 0) page--;
      await msg.edit({ components: [await buildPage(page)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });

    collector.on('end', () => {
      msg.edit({ components: [msg.components?.[0] || new ContainerBuilder()], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  }
};
