const blacklist = require("@db/blacklist.js");
const premium = require("@db/premium.js");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");
const ms = require("ms");

module.exports = {
  name: "add",
  aliases: ['addprem', 'givepremium'],
  category: "owner",
  usage: "<mention or user ID>",
  description: "Interactive menu to add premium or blacklist a user",
  args: true,
  admin: true,
  owner: true,
  execute: async (client, message, args, emoji) => {
    let id = message.mentions.members.first()?.user.id || args[0]?.replace(/[^0-9]/g, '');
    
    if (!id) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid User`));
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    let user = await client.users.fetch(id).catch(() => null);
    if (!user) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.no} User Not Found`));
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("add_premium").setLabel("Premium").setStyle(ButtonStyle.Primary).setEmoji(blackEmoji.premium),
      new ButtonBuilder().setCustomId("add_blacklist").setLabel("Blacklist").setStyle(ButtonStyle.Danger).setEmoji(blackEmoji.no)
    );

    const mainContainer = new ContainerBuilder();
    mainContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.user} Action Manager`));
    mainContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    mainContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.arrow} **User:** ${user.tag}\n${blackEmoji.arrow} Choose an action to perform:`));
    mainContainer.addActionRowComponents(row1);

    const m = await message.reply({ components: [mainContainer], flags: MessageFlags.IsComponentsV2 });

    const collector = m.createMessageComponentCollector({ filter: (i) => i.user.id === message.author.id, time: 60000 });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "add_premium") {
        const select = new StringSelectMenuBuilder()
          .setCustomId("prem_plan")
          .setPlaceholder("Select a Plan")
          .addOptions([
            { label: "1 Month", value: "30d", description: "30 days of premium" },
            { label: "3 Months", value: "90d", description: "90 days of premium" },
            { label: "1 Year", value: "365d", description: "365 days of premium" },
            { label: "Lifetime", value: "lifetime", description: "Permanent premium access" }
          ]);

        const planContainer = new ContainerBuilder();
        planContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.premium} Select Plan`));
        planContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.arrow} Choose a premium plan for **${user.tag}**:`));
        planContainer.addActionRowComponents(new ActionRowBuilder().addComponents(select));

        await interaction.update({ components: [planContainer] });
      } else if (interaction.customId === "add_blacklist") {
        await blacklist.set(`${client.user.id}_${user.id}`, true);
        const blContainer = new ContainerBuilder();
        blContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Blacklisted`));
        blContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.arrow} **${user.tag}** has been added to the blacklist.`));
        await interaction.update({ components: [blContainer] });
        collector.stop();
      } else if (interaction.customId === "prem_plan") {
        const plan = interaction.values[0];
        const duration = plan === "lifetime" ? true : Date.now() + ms(plan);
        
        const dbKey = `${client.user.id}_${user.id}`;
        await premium.set(dbKey, duration);

        const finalContainer = new ContainerBuilder();
        finalContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Premium Added`));
        finalContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Target:** ${user.tag}\n` +
          `${blackEmoji.arrow} **Type:** User\n` +
          `${blackEmoji.arrow} **Plan:** ${plan}\n` +
          `${blackEmoji.arrow} **Expires:** ${plan === "lifetime" ? "Never" : `<t:${Math.round(duration / 1000)}:f>`}`
        ));
        await interaction.update({ components: [finalContainer] });
        collector.stop();
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time" && collected.size === 0) m.edit({ components: [] }).catch(() => {});
    });
  }
};