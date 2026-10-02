const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const ModWarn = require('@db/modWarn.js');

module.exports = {
  name: 'warnings',
  aliases: ['warns', 'warnlist'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user>',
  description: 'View all warnings for a member',
  args: true,
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
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!target) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid member.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      const doc = await ModWarn.findOne({ guildId: message.guild.id, userId: target.id });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.list} Warnings for ${target.user.tag}`
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      if (!doc || doc.warnings.length === 0) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.yes} **${target.user.tag}** has no warnings in this server.`
        ));
      } else {
        const warnings = doc.warnings;
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.bell} **Total Warnings:** ${warnings.length}`
        ));
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

        const lines = warnings.slice(-10).map((w, i) => {
          const ts = Math.floor(new Date(w.timestamp).getTime() / 1000);
          return `**#${i + 1}** — ID: \`${w.warnId}\`\n${blackEmoji.arrow} **Reason:** ${w.reason}\n${blackEmoji.mod} <@${w.moderatorId}> • <t:${ts}:d>`;
        });

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n\n')));

        if (warnings.length > 10) {
          container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `*Showing last 10 of ${warnings.length} warnings.*`
          ));
        }
      }

      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to fetch warnings: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
