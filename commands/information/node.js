/** @format
 *
 * Made By Alive
 */

const moment = require("moment-timezone");
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "node",
  aliases: ['nodeinfo', 'lavalink'],
  cooldown: "",
  category: "information",
  usage: "",
  description: "Shows Lavalink node information",
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
  execute: async (client, message, args, emoji) => {
    try {
      const loadingContainer = new ContainerBuilder();
      loadingContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.loading} **Fetching node details, please wait . . .**`
        )
      );

      const wait = await message.channel.send({
        components: [loadingContainer],
        flags: MessageFlags.IsComponentsV2
      });

      const formatUptime = (ms) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));

        let timeString = `${hours}h ${minutes}m ${seconds}s`;
        if (days > 0) timeString = `${days}d ${timeString}`;
        return timeString;
      };

      const getNodeStats = async () => {
        let nodeStats = "";

        client.manager.shoukaku.nodes.forEach((node) => {
          const isNodeOnline = node.stats && node.stats.players > 0;
          const formattedUptime = node.stats ? formatUptime(node.stats.uptime) : "N/A";
          const totalPlayers = node.stats?.players || 0;

          const cpuLoad = node.stats?.cpu ? (node.stats.cpu.systemLoad + node.stats.cpu.lavalinkLoad).toFixed(2) : "N/A";
          const cpuCores = node.stats?.cpu ? node.stats.cpu.cores * 100 : "N/A";

          const quality = totalPlayers > 0 ? (node.stats?.cpu.lavalinkLoad < 0.7 ? "Good" : "Average") : "No songs playing";
          const nodeStatus = isNodeOnline ? `${blackEmoji.online} **Online**` : `${blackEmoji.offline} **Offline**`;

          nodeStats += `**${blackEmoji.cog} ${node.name}**\n` +
            `**Status:** ${nodeStatus}\n` +
            `**Players:** \`${totalPlayers}\`\n` +
            `**CPU Load:** \`${cpuLoad}/${cpuCores} %vCPU\`\n` +
            `**RAM Usage:** \`${(node.stats?.memory?.used / (1024 * 1024 * 1024)).toFixed(1)} GiB / ${(node.stats?.memory?.reservable / (1024 * 1024 * 1024)).toFixed(1)} GiB\`\n` +
            `**Uptime:** \`${formattedUptime}\`\n` +
            `**Quality:** \`${quality}\`\n\n`;
        });

        return nodeStats;
      };

      const createNodeContainer = async () => {
        const nodeStats = await getNodeStats();

        const currentISTTime = moment().tz("Asia/Kolkata").format("DD MMM YYYY, HH:mm:ss [IST]");
        const currentUTCTime = moment().utc().format("DD MMM YYYY, HH:mm:ss [UTC]");

        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# Lavalink Node Stats`)
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(nodeStats)
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.info} **Monitor Details:**\n` +
            `Time (UTC): \`${currentUTCTime}\`\n` +
            `Time (IST): \`${currentISTTime}\``
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.point} **Highlights:**\n` +
            `${blackEmoji.point} Need your own Lavalink server? **We host Lavalink** starting at just **$4.99/month**!`
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `*Real-time Lavalink node stats | Last updated: ${currentISTTime}*`
          )
        );

        return container;
      };

      const nodeStatsContainer = await createNodeContainer();
      await wait.edit({
        components: [nodeStatsContainer],
        flags: MessageFlags.IsComponentsV2
      });

      let updateCount = 0;
      const maxUpdates = 5;
      const interval = setInterval(async () => {
        try {
          const fetchedMessage = await message.channel.messages.fetch(wait.id).catch(() => null);
          if (!fetchedMessage) {
            clearInterval(interval);
            return;
          }

          const updatedContainer = await createNodeContainer();
          await wait.edit({
            components: [updatedContainer],
            flags: MessageFlags.IsComponentsV2
          });

          updateCount++;
          if (updateCount >= maxUpdates) {
            clearInterval(interval);
          }
        } catch (error) {
          clearInterval(interval);
        }
      }, 60000);
    } catch (error) {
      console.error("An error occurred in the node command:", error);
      const errorContainer = new ContainerBuilder();
      errorContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "An error occurred while fetching the node stats. Please try again later."
        )
      );
      await message.channel.send({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2
      });
    }
  },
};