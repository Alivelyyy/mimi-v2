/** @format
 * Mimi By ApeX
 */

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
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "stats",
  aliases: ['botstats', 'botstat'],
  cooldown: "5",
  category: "information",
  usage: "",
  description: "Shows detailed bot statistics and performance metrics",
  args: false,
  vote: false,
  new: false,
  execute: async (client, message, args, emoji) => {
    const loadingContainer = new ContainerBuilder();
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${blackEmoji.loading} **Gathering system information...**`)
    );

    const loading = await message.reply({ components: [loadingContainer], flags: MessageFlags.IsComponentsV2 });

    const clusterStats = await client.cluster.broadcastEval(async (c) => {
      const cpuUsage = await new Promise((resolve) => {
        require("os-utils").cpuUsage(v => resolve(v));
      });

      return {
        ping: c.ws.ping,
        uptime: c.formatTime(c.uptime),
        ram: c.formatBytes(process.memoryUsage().heapUsed),
        cpu: cpuUsage.toFixed(2),
        players: {
          active: [...c.manager.players.values()].filter(p => p.playing).length,
          total: c.manager.players.size
        },
        guilds: c.guilds.cache.size,
        users: await c.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0)
      };
    });

    let totalUsers = 0;
    let totalGuilds = 0;
    let totalPlayers = { active: 0, total: 0 };

    let clusterStatsText = '';
    clusterStats.forEach((stats, i) => {
      totalUsers += stats.users;
      totalGuilds += stats.guilds;
      totalPlayers.active += stats.players.active;
      totalPlayers.total += stats.players.total;

      clusterStatsText += `**${blackEmoji.cog} Cluster [${i}]**\n` +
        `${blackEmoji.server} **Performance Metrics**\n` +
        `⠀⠀${blackEmoji.ping} Latency: \`${stats.ping}ms\`\n` +
        `⠀⠀${blackEmoji.time} Uptime: \`${stats.uptime}\`\n` +
        `⠀⠀${blackEmoji.ram} Memory: \`${stats.ram}\`\n` +
        `⠀⠀${blackEmoji.stats} CPU Load: \`${stats.cpu}%\`\n` +
        `${blackEmoji.data} **Usage Statistics**\n` +
        `⠀⠀${blackEmoji.music} Players: \`${stats.players.active}/${stats.players.total}\`\n` +
        `⠀⠀${blackEmoji.server} Servers: \`${stats.guilds.toLocaleString()}\`\n` +
        `⠀⠀${blackEmoji.user} Users: \`${stats.users.toLocaleString()}\`\n\n`;
    });

    const statsContainer = new ContainerBuilder();
    statsContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${client.user.username} Statistics`)
    );
    statsContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    statsContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(clusterStatsText)
    );
    statsContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('stats').setLabel('Statistics').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('node').setLabel('Node Info').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('stop').setLabel(blackEmoji.closeX).setStyle(ButtonStyle.Danger)
      )
    );

    const nodeContainer = new ContainerBuilder();
    nodeContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${client.user.username} Node Information`)
    );
    nodeContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    let nodeStatsText = `${blackEmoji.link} **Node Status** | [node.Mimibot.me](https://node.Mimibot.me)\n\n`;
    nodeStatsText += [...client.manager.shoukaku.nodes.values()]
      .map(node => {
        const systemLoad = (node.stats.cpu.systemLoad * 100).toFixed(2);
        const lavalinkLoad = (node.stats.cpu.lavalinkLoad * 100).toFixed(2);
        const memoryUsed = (node.stats.memory.used / 1024 / 1024 / 1024).toFixed(2);
        const memoryAllocated = ((node.stats.memory.reservable + node.stats.memory.allocated) / 1024 / 1024 / 1024).toFixed(2);

        return `${blackEmoji.music} **${node.name}**\n` +
          `⠀⠀${blackEmoji.user} Players: \`${node.stats.players}\`\n` +
          `⠀⠀${blackEmoji.stats} CPU: \`${systemLoad}/${lavalinkLoad}%\`\n` +
          `⠀⠀${blackEmoji.ram} RAM: \`${memoryUsed}/${memoryAllocated} GB\`\n` +
          `⠀⠀${blackEmoji.time} Uptime: \`${client.formatTime(node.stats.uptime)}\``;
      })
      .join('\n\n');

    nodeStatsText += `\n\n**${blackEmoji.ping} Global Statistics**\n` +
      `${blackEmoji.user} Total Users: \`${totalUsers.toLocaleString()}\`\n` +
      `${blackEmoji.server} Total Servers: \`${totalGuilds.toLocaleString()}\`\n` +
      `${blackEmoji.music} Active Players: \`${totalPlayers.active}/${totalPlayers.total}\``;

    nodeContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(nodeStatsText)
    );
    nodeContainer.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('stats').setLabel('Statistics').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('node').setLabel('Node Info').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('stop').setLabel(blackEmoji.closeX).setStyle(ButtonStyle.Danger)
      )
    );

    const containers = [statsContainer, nodeContainer];
    let currentPage = 0;

    const response = await loading.edit({ components: [containers[currentPage]], flags: MessageFlags.IsComponentsV2 });

    const collector = response.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 60000,
      idle: 30000
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      switch (interaction.customId) {
        case 'stats': currentPage = 0; break;
        case 'node': currentPage = 1; break;
        case 'stop': return collector.stop();
      }

      await response.edit({ components: [containers[currentPage]], flags: MessageFlags.IsComponentsV2 });
    });

    collector.on('end', () => {
      const containerTitles = [
        `# ${client.user.username} Statistics`,
        `# ${client.user.username} Node Information`
      ];

      const finalContainer = new ContainerBuilder();
      finalContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${containerTitles[currentPage]}\n\n*Interaction timed out*`)
      );
      response.edit({ components: [finalContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  }
};
