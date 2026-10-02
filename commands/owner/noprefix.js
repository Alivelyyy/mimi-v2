const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");
const ms = require("ms");

module.exports = {
  name: "noprefix",
  aliases: ['np', 'nopfx'],
  cooldown: "",
  category: "owner",
  usage: "<user mention/id>",
  description: "Manage no-prefix users with plan selection",
  args: true,
  vote: false,
  new: false,
  admin: true,
  owner: true,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    let id = message.mentions.members.first()?.user.id ||
      args[0]?.replace(/[^0-9]/g, '');

    if (!id) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid User`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} Please provide a valid user mention or ID\n` +
          `${blackEmoji.arrow} **Usage:** \`${client.prefix}noprefix <@user/id>\``
        )
      );
      return await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    let user = await client.users.fetch(id, { force: true }).catch(() => null);
    
    if (!user) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.no} User Not Found`)
      );
      return await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const currentNp = await client.db.np.get(user.id);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("noprefix_select")
      .setPlaceholder("Select a duration for NoPrefix")
      .addOptions([
        { label: "1 Day", value: "1d", description: "Add NoPrefix for 24 hours" },
        { label: "7 Days", value: "7d", description: "Add NoPrefix for 1 week" },
        { label: "30 Days", value: "30d", description: "Add NoPrefix for 1 month" },
        { label: "Permanent", value: "perm", description: "Add NoPrefix forever" },
        { label: "Remove", value: "remove", description: "Remove NoPrefix access" }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const mainContainer = new ContainerBuilder();
    mainContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.user} NoPrefix Manager`)
    );
    mainContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    mainContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **User:** ${user.tag} (\`${user.id}\`)\n` +
        `${blackEmoji.arrow} **Current Status:** ${currentNp ? (typeof currentNp === 'number' ? `<t:${Math.round(currentNp / 1000)}:R>` : 'Permanent') : 'None'}\n\n` +
        `Select a plan from the menu below to update their access.`
      )
    );
    mainContainer.addActionRowComponents(row);

    const m = await message.reply({
      components: [mainContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = m.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000
    });

    collector.on("collect", async (interaction) => {
      const choice = interaction.values[0];
      const resultContainer = new ContainerBuilder();

      if (choice === "remove") {
        await client.db.np.delete(user.id);
        resultContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} NoPrefix Removed`)
        );
        resultContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`${blackEmoji.arrow} Removed access for ${user.tag}`)
        );
      } else {
        let duration = choice === "perm" ? true : Date.now() + ms(choice);
        await client.db.np.set(user.id, duration);
        
        resultContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} NoPrefix Updated`)
        );
        resultContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} **User:** ${user.tag}\n` +
            `${blackEmoji.arrow} **Plan:** ${choice === "perm" ? 'Permanent' : choice}\n` +
            `${blackEmoji.arrow} **Expires:** ${choice === "perm" ? 'Never' : `<t:${Math.round(duration / 1000)}:f>`}`
          )
        );
      }

      await interaction.update({
        components: [resultContainer],
        flags: MessageFlags.IsComponentsV2
      });
      collector.stop();
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time" && collected.size === 0) {
        await m.edit({ components: [] }).catch(() => {});
      }
    });
  }
};
