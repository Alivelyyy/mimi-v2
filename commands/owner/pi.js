const os = require("os");
const osUtils = require("os-utils");
const { performance } = require("perf_hooks");
const {
  GatewayIntentBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  version: djsVersion
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "pi",
  aliases: ['pistat', 'sysstat'],
  cooldown: "",
  category: "owner",
  usage: "",
  description: "Displays bot system stats",
  args: false,
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
    const loadingContainer = new ContainerBuilder();
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.loading} Fetching Stats`)
    );
    loadingContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${blackEmoji.arrow} Please wait...`)
    );
    
    const m = await message.reply({
      components: [loadingContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    let cpuUsage = await new Promise((resolve) => {
      osUtils.cpuUsage((v) => resolve((v * 100).toFixed(2)));
    });

    const getTotalStats = async () => {
      if (!client.shard) {
        return [
          client.users.cache.size,
          client.guilds.cache.reduce((sum, g) => sum + g.memberCount, 0),
          client.guilds.cache.size,
        ];
      } else {
        const res = await client.shard.broadcastEval((c) => [
          c.users.cache.size,
          c.guilds.cache.reduce((sum, g) => sum + g.memberCount, 0),
          c.guilds.cache.size,
        ]);
        return res.reduce((acc, n) => [acc[0] + n[0], acc[1] + n[1], acc[2] + n[2]], [0, 0, 0]);
      }
    };

    const total = await getTotalStats();
    const intents = GatewayIntentBits;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.stats} Process Information`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **PID:** \`${process.pid}\`\n` +
        `${blackEmoji.arrow} **PPID:** \`${process.ppid}\`\n` +
        `${blackEmoji.djs} **Discord.js:** \`v${djsVersion}\`\n` +
        `${blackEmoji.node} **Node.js:** \`${process.version}\`\n` +
        `${blackEmoji.arrow} **Platform:** \`${process.platform}\``
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${blackEmoji.ram} Resource Usage`)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **CPU:** \`${cpuUsage}%\`\n` +
        `${blackEmoji.arrow} **Memory:** \`${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB\`\n` +
        `${blackEmoji.arrow} **Load Time:** \`${(client.readyAt - performance.timeOrigin).toFixed(2)}ms\`\n` +
        `${blackEmoji.arrow} **Ready:** ${(client.readyAt).toLocaleString()}`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${blackEmoji.server} Guild & User Stats`)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Mode:** Cluster\n` +
        `${blackEmoji.arrow} **Shards:** \`${client.options.shardCount || 1}\`\n` +
        `${blackEmoji.arrow} **Guilds:** \`${total[2]}\`\n` +
        `${blackEmoji.arrow} **Cached Users:** \`${total[0]}\`\n` +
        `${blackEmoji.arrow} **Total Users:** \`${total[1]}\``
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${blackEmoji.cog} Client Intents`)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Guild Presences:** ${client.options.intents.has(intents.GuildPresences) ? blackEmoji.on : blackEmoji.off}\n` +
        `${blackEmoji.arrow} **Guild Members:** ${client.options.intents.has(intents.GuildMembers) ? blackEmoji.on : blackEmoji.off}\n` +
        `${blackEmoji.arrow} **Message Content:** ${client.options.intents.has(intents.MessageContent) ? blackEmoji.on : blackEmoji.off}`
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${blackEmoji.ping} Latency`)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Shard:** \`${message.guild.shardId}\`\n` +
        `${blackEmoji.arrow} **WS Latency:** \`${client.ws.ping}ms\`\n` +
        `${blackEmoji.arrow} **Message Latency:** \`${m.createdTimestamp - message.createdTimestamp}ms\``
      )
    );

    m.edit({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
