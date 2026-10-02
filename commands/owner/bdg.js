const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const badges = require("@db/badges.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "badge",
  aliases: ['badge', 'givebadge'],
  category: "owner",
  description: "Manage user badges",
  args: true,
  admin: true,
  owner: true,
  execute: async (client, message, args, emoji) => {
    const validBadges = {
      dev: "Developer",
      owner: "Owner", 
      earlysupporter: "Early Supporter",
      beta: "Beta Tester",
      friend: "Friend",
      partner: "Partner",
      staff: "Staff Team",
      vip: "VIP Member",
      contributor: "Contributor"
    };

    const targetUser = message.mentions.users.first();
    const targetId = targetUser?.id || args[0];

    if (!targetId) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Missing User`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Please mention a user or provide their ID\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}badge <user> [add/del] [badge]\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    let user;
    try {
      user = await client.users.fetch(targetId);
    } catch (error) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} User Not Found`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Could not find a user with ID: \`${targetId}\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    let userBadges = await badges.get(`${client.user.id}_${user.id}`) || [];

    if (args[1]) {
      const action = args[1].toLowerCase();
      const badgeKey = args[2]?.toLowerCase();

      if (!badgeKey || !validBadges[badgeKey]) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid Badge`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} **Valid badges:** ${Object.keys(validBadges).map(b => `\`${b}\``).join(', ')}`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      switch (action) {
        case 'add':
          if (userBadges.includes(badgeKey)) {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Badge Already Exists`)
            );
            container.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `${blackEmoji.arrow} ${user.tag} already has the **${validBadges[badgeKey]}** badge`
              )
            );
            return message.reply({
              components: [container],
              flags: MessageFlags.IsComponentsV2,
            });
          }

          userBadges.push(badgeKey);
          await badges.set(`${client.user.id}_${user.id}`, userBadges);
          const addContainer = new ContainerBuilder();
          addContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Badge Added`)
          );
          addContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          addContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.user} **User:** ${user.tag}\n` +
              `${blackEmoji.arrow} **Badge:** ${validBadges[badgeKey]}\n` +
              `${blackEmoji.stats} **Total Badges:** ${userBadges.length}`
            )
          );
          return message.reply({
            components: [addContainer],
            flags: MessageFlags.IsComponentsV2,
          });

        case 'del':
        case 'remove':
          if (!userBadges.includes(badgeKey)) {
            const noBadgeContainer = new ContainerBuilder();
            noBadgeContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Badge Not Found`)
            );
            noBadgeContainer.addSeparatorComponents(
              new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
            noBadgeContainer.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `${blackEmoji.arrow} ${user.tag} doesn't have the **${validBadges[badgeKey]}** badge`
              )
            );
            return message.reply({
              components: [noBadgeContainer],
              flags: MessageFlags.IsComponentsV2,
            });
          }

          const index = userBadges.indexOf(badgeKey);
          userBadges.splice(index, 1);
          await badges.set(`${client.user.id}_${user.id}`, userBadges);
          const removeContainer = new ContainerBuilder();
          removeContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Badge Removed`)
          );
          removeContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          removeContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.user} **User:** ${user.tag}\n` +
              `${blackEmoji.arrow} **Badge:** ${validBadges[badgeKey]}\n` +
              `${blackEmoji.stats} **Remaining Badges:** ${userBadges.length}`
            )
          );
          return message.reply({
            components: [removeContainer],
            flags: MessageFlags.IsComponentsV2,
          });

        default:
          const defaultContainer = new ContainerBuilder();
          defaultContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid Action`)
          );
          defaultContainer.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          defaultContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} **Valid actions:** \`add\`, \`del\`/\`remove\``
            )
          );
          return message.reply({
            components: [defaultContainer],
            flags: MessageFlags.IsComponentsV2,
          });
      }
    }

    const badgeOptions = Object.entries(validBadges).map(([key, name]) => {
      const hasBadge = userBadges.includes(key);
      return {
        label: `${hasBadge ? 'Remove' : 'Add'} ${name}`,
        value: `${hasBadge ? 'del' : 'add'}_${key}`,
        description: `Badge: ${name}`,
        emoji: hasBadge ? blackEmoji.off : blackEmoji.on
      };
    });

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.dev} Badge Management`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${user.tag}\n` +
        `${blackEmoji.info} **ID:** \`${user.id}\``
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Current Badges**\n` +
        `${userBadges.length ? userBadges.map(b => `${blackEmoji[b] || blackEmoji.arrow} ${validBadges[b] || b}`).join('\n') : `${blackEmoji.arrow} No badges`}`
      )
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('badge_select')
          .setPlaceholder('Select badges to add/remove')
          .setMinValues(1)
          .setMaxValues(Math.min(badgeOptions.length, 9))
          .addOptions(badgeOptions)
      )
    );

    const m = await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) return true;
      const notAllowedContainer = new ContainerBuilder();
      notAllowedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Only **${message.author.tag}** can use this`)
      );
      await interaction.reply({
        components: [notAllowedContainer],
        flags: MessageFlags.IsComponentsV2 | 64,
      }).catch(() => {});
      return false;
    };

    const collector = m?.createMessageComponentCollector({
      filter: filter,
      time: 60000,
      idle: 30000
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate().catch(() => {});

      for (let value of interaction.values) {
        let [action, badgeKey] = value.split('_');

        if (action === 'add' && !userBadges.includes(badgeKey)) {
          userBadges.push(badgeKey);
        } else if (action === 'del' && userBadges.includes(badgeKey)) {
          let index = userBadges.indexOf(badgeKey);
          index !== -1 ? userBadges.splice(index, 1) : null;
        }
      }

      await badges.set(`${client.user.id}_${user.id}`, userBadges);

      const updatedOptions = Object.entries(validBadges).map(([key, name]) => {
        const hasBadge = userBadges.includes(key);
        return {
          label: `${hasBadge ? 'Remove' : 'Add'} ${name}`,
          value: `${hasBadge ? 'del' : 'add'}_${key}`,
          description: `Badge: ${name}`,
          emoji: hasBadge ? blackEmoji.off : blackEmoji.on
        };
      });

      const updatedContainer = new ContainerBuilder();
      updatedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.dev} Badge Management`)
      );
      updatedContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      updatedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.user} **User:** ${user.tag}\n` +
          `${blackEmoji.info} **ID:** \`${user.id}\``
        )
      );
      updatedContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      updatedContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Current Badges**\n` +
          `${userBadges.length ? userBadges.map(b => `${blackEmoji[b] || blackEmoji.arrow} ${validBadges[b] || b}`).join('\n') : `${blackEmoji.arrow} No badges`}`
        )
      );
      updatedContainer.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('badge_select')
            .setPlaceholder('Select badges to add/remove')
            .setMinValues(1)
            .setMaxValues(Math.min(updatedOptions.length, 9))
            .addOptions(updatedOptions)
        )
      );

      await m.edit({
        components: [updatedContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    });

    collector?.on("end", async () => {
      await m.edit({ components: [] }).catch(() => {});
    });
  }
};
