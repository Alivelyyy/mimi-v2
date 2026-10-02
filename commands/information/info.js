const counts = require("@utils/codestats.js");
const {
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "info",
  aliases: ['botinfo', 'about'],
  cooldown: "",
  category: "information",
  usage: "",
  description: "Shows bot-info",
  args: false,
  vote: false,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const totalCommands = client.commands.size;
    const { readdirSync } = require("fs");
    const categories = readdirSync("./commands").filter(dir => dir !== "owner");

    let commandsWithAliases = 0;
    let totalAliases = 0;

    client.commands.forEach(cmd => {
      if (cmd.aliases && cmd.aliases.length > 0) {
        commandsWithAliases++;
        totalAliases += cmd.aliases.length;
      }
    });

    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m`;

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("info_overview").setEmoji(blackEmoji.home).setLabel("Overview").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("info_tech").setEmoji(blackEmoji.cog).setLabel("Tech").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("info_team").setEmoji(blackEmoji.users).setLabel("Team").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("info_credits").setEmoji(blackEmoji.trophy).setLabel("Credits").setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("info_sponsors").setEmoji(blackEmoji.diamond).setLabel("Sponsors").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("info_privacy").setEmoji(blackEmoji.cog).setLabel("Privacy").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("info_partners").setEmoji(blackEmoji.partner).setLabel("Partners").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("info_close").setEmoji(blackEmoji.close).setLabel("Close").setStyle(ButtonStyle.Danger)
    );

    const buildOverview = () => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${client.user.username}`)
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> A feature-rich Discord Music Bot powered by Lavalink\n` +
          `> Delivering high-quality audio with premium features\n\n` +
          `**Key Features**\n` +
          `${blackEmoji.music} High Quality Music Playback\n` +
          `${blackEmoji.filter} Advanced Audio Filters\n` +
          `${blackEmoji.cog} Custom Server Settings\n` +
          `${blackEmoji.link} Multi-Platform Support\n` +
          `${blackEmoji.catModeration} Server Protection & AutoMod\n` +
          `${blackEmoji.catTickets} Ticket System & Giveaways`
        )
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.stats} **Commands:** \`${totalCommands}\` total ─ ` +
          `${blackEmoji.files} **Categories:** \`${categories.length}\` ─ ` +
          `${blackEmoji.time} **Uptime:** \`${uptimeStr}\``
        )
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Page 1/7 • Made with love by ApeX`)
      );
      c.addActionRowComponents(row1, row2);
      return c;
    };

    const buildTech = () => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${client.user.username} — Technical Details`)
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.bot} **Bot Version:** \`v${require('@root/package.json').version}-Mimi\`\n` +
          `${blackEmoji.djs} **Discord.js:** \`v${require('discord.js').version}\`\n` +
          `${blackEmoji.node} **Node.js:** \`${process.version}\`\n` +
          `${blackEmoji.cog} **System Manager:** \`M-3.1.3\`\n` +
          `${blackEmoji.link} **API Handler:** \`iV-Linker\`\n` +
          `${blackEmoji.music} **Audio Engine:** \`Kazagumo v${require('@root/package.json').dependencies['kazagumo'].replace('^', '')}\`\n` +
          `${blackEmoji.files} **Files:** \`${counts.fileCount}\` ─ **Directories:** \`${counts.directoryCount}\`\n` +
          `${blackEmoji.list} **Lines of Code:** \`${counts.totalLines}\``
        )
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Page 2/7 • Protected by DMCA`)
      );
      c.addActionRowComponents(row1, row2);
      return c;
    };

    const buildTeam = () => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${client.user.username} — Development Team`)
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Core Team**\n\n` +
          `${blackEmoji.crown} **[Alive !](https://discord.gg/XSUZQZn3yB)**\n> Owner & Lead Developer\n\n` +
          `${blackEmoji.catModeration} **[Sharanya](https://discord.gg/XSUZQZn3yB)**\n> Support Lead & Co-Owner\n\n` +
          `${blackEmoji.partner} **[Abhi??](https://discord.gg/XSUZQZn3yB)**\n> Co-Owner\n\n` +
          `${blackEmoji.message} **[Itz_Me](https://discord.gg/XSUZQZn3yB)**\n> Support Manager`
        )
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Page 3/7 • Join our community!`)
      );
      c.addActionRowComponents(row1, row2);
      return c;
    };

    const buildCredits = () => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${client.user.username} — Honorable Mentions`)
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Special Thanks**\n\n` +
          `${blackEmoji.trophy} **[Leox](https://discord.gg/XSUZQZn3yB)** — Friend & Contributor`
        )
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Page 4/7 • By ApeX`)
      );
      c.addActionRowComponents(row1, row2);
      return c;
    };

    const buildSponsors = () => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${client.user.username} — Sponsors`)
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Our Sponsors**\n\n` +
          `${blackEmoji.diamond} *Your name could be here!*\n` +
          `> The best premium hosting experience`
        )
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Page 5/7 • By ApeX`)
      );
      c.addActionRowComponents(row1, row2);
      return c;
    };

    const buildPrivacy = () => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${client.user.username} — Privacy & Data`)
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Data We Store**\n\n` +
          `${blackEmoji.arrow} **User IDs** — Vote and premium management\n` +
          `${blackEmoji.arrow} **Guild IDs** — Vote and premium management\n` +
          `${blackEmoji.arrow} **Command Logs** — Bot usage and growth analytics\n` +
          `${blackEmoji.arrow} **Song Logs** — Bot usage and growth analytics\n\n` +
          `> We only store what's necessary to provide our services.\n` +
          `> No personal data is shared with third parties.`
        )
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Page 6/7 • Your privacy matters`)
      );
      c.addActionRowComponents(row1, row2);
      return c;
    };

    const buildPartners = () => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${client.user.username} — Partners & Affiliates`)
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Our Partners**\n\n` +
          `${blackEmoji.partner} [Get your Bot listed here](${client.invite?.admin?.replace?.(`${client.user.id}`, '') || client.support})\n` +
          `> Interested in partnering? Join our support server!`
        )
      );
      c.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Page 7/7 • By ApeX`)
      );
      c.addActionRowComponents(row1, row2);
      return c;
    };

    const pages = {
      info_overview: buildOverview,
      info_tech: buildTech,
      info_team: buildTeam,
      info_credits: buildCredits,
      info_sponsors: buildSponsors,
      info_privacy: buildPrivacy,
      info_partners: buildPartners
    };

    const m = await message.reply({
      components: [buildOverview()],
      flags: MessageFlags.IsComponentsV2,
    });

    const filter = async (interaction) => {
      if (interaction.user.id === message.author.id) return true;
      await interaction.reply({
        content: `${blackEmoji.no} Only **${message.author.tag}** can use this.`,
        ephemeral: true,
      }).catch(() => {});
      return false;
    };

    const collector = m?.createMessageComponentCollector({
      filter,
      time: 120000,
      idle: 60000,
    });

    collector?.on("collect", async (interaction) => {
      if (!interaction.deferred) await interaction.deferUpdate();

      if (interaction.customId === 'info_close') {
        await m?.delete().catch(() => {});
        return;
      }

      const builder = pages[interaction.customId];
      if (builder) {
        await m.edit({ components: [builder()], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });

    collector?.on("end", async () => {
      await m.edit({ components: [] }).catch(() => {});
    });
  },
};
