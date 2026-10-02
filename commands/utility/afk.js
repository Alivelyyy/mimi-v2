const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");
const { setAfk } = require("@db/afk.js");

module.exports = {
  name: "afk",
  aliases: ['away', 'setafk'],
  category: "utility",
  description: "Set your AFK status - others will be notified when they mention you",
  usage: "[reason]",
  args: false,
  cooldown: 5,
  userPerms: [],
  botPerms: [],
  owner: false,

  execute: async (client, message, args, emoji) => {
    const userId  = message.author.id;
    const guildId = message.guild.id;
    const reason  = args.length > 0 ? args.join(" ") : "AFK";

    if (reason.length > 200) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} AFK reason cannot exceed 200 characters.`)
      );
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("afk_server")
        .setLabel("This Server Only")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("afk_global")
        .setLabel("Global (All Mutuals)")
        .setStyle(ButtonStyle.Secondary)
    );

    const promptContainer = new ContainerBuilder();
    promptContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.bell} Set AFK`)
    );
    promptContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    promptContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Reason:** ${reason}\n\n` +
        `Where should your AFK apply?`
      )
    );
    promptContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    promptContainer.addActionRowComponents(row);

    const msg = await message.reply({
      components: [promptContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    let interaction;
    try {
      interaction = await msg.awaitMessageComponent({
        filter: (i) => i.user.id === userId,
        time: 30000,
      });
    } catch {
      return;
    }

    await interaction.deferUpdate().catch(() => {});

    const isGlobal = interaction.customId === "afk_global";

    try {
      await setAfk(userId, guildId, reason, isGlobal);
    } catch (err) {
      const errContainer = new ContainerBuilder();
      errContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to set AFK: ${err.message}`)
      );
      await msg.edit({
        components: [errContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
      return;
    }

    const scope     = isGlobal ? "all mutual servers" : `this server`;
    const scopeIcon = isGlobal ? blackEmoji.globe : blackEmoji.home;

    const doneContainer = new ContainerBuilder();
    doneContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} AFK Activated`)
    );
    doneContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    doneContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${scopeIcon} **Scope:** ${scope}\n` +
        `${blackEmoji.arrow} **Reason:** ${reason}\n\n` +
        `I'll notify anyone who mentions you and welcome you back when you return!`
      )
    );

    await msg.edit({
      components: [doneContainer],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});
  },
};
