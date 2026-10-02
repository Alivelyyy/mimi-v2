const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const os = require("os");
const moment = require("moment");
require("moment-duration-format");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "system",
  description: "Displays detailed system statistics",
  category: "information",
  cooldown: 5,
  execute: async (client, message, args, emoji) => {
    // Get CPU information
    const cpus = os.cpus();
    const cpu = cpus[0];
    const totalCores = cpus.length;
    const cpuUsage = (os.loadavg()[0] / totalCores * 100).toFixed(2);

    // Memory calculations
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const formatBytes = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2);

    // Process stats
    const processUptime = moment.duration(process.uptime(), "seconds").format("D [days], H [hrs], m [mins]");
    const systemUptime = moment.duration(os.uptime(), "seconds").format("D [days], H [hrs], m [mins]");

    // Disk Space (Linux/macOS) - Retaining error handling from original code
    let diskUsage = "Unavailable";
    try {
      const disk = require('child_process').execSync("df -h --total | grep total").toString().split(/\s+/);
      diskUsage = `Total: ${disk[1]}, Used: ${disk[2]}, Free: ${disk[3]}`;
    } catch (error) {
      diskUsage = "Command not supported on this OS.";
    }

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.cog} System Information`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**System Overview**\n` +
        `\`\`\`yml\n` +
        `Platform  : ${os.platform()} ${os.release()}\n` +
        `Arch      : ${os.arch()}\n` +
        `CPU Model : ${cpu.model}\n` +
        `Cores     : ${totalCores} (${cpuUsage}% usage)\n` +
        `Node.js   : ${process.version}\n` +
        `Discord.js: v${require("discord.js").version}\`\`\``
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${blackEmoji.ram} Memory Usage**\n` +
        `\`\`\`yml\n` +
        `Total     : ${formatBytes(totalMem)} GB\n` +
        `Used      : ${formatBytes(usedMem)} GB\n` +
        `Free      : ${formatBytes(freeMem)} GB\n` +
        `Process   : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`\`\``
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${blackEmoji.time} Uptime Information**\n` +
        `\`\`\`yml\n` +
        `Process   : ${processUptime}\n` +
        `System    : ${systemUptime}\`\`\``
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${blackEmoji.disk} Disk Usage**\n` +
        `\`\`\`yml\n${diskUsage}\`\`\``
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`*Requested by ${message.author.username}*`)
    );

    await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};