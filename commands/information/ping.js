/** @format
 * 
 * Mimi By ApeX
 */

const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "ping",
  aliases: ['latency', 'ms'],
  cooldown: "3",
  category: "information",
  usage: "",
  description: "Shows detailed latency information",
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
    const { MessageFlags } = require("discord.js");
    
    const loadingContainer = new ContainerBuilder();
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${blackEmoji.loading} **Measuring latency, please wait...**`)
    );

    const m = await message.reply({ components: [loadingContainer], flags: MessageFlags.IsComponentsV2 });

    // Database latency test
    const dbLatency = async () => {
      const start = Date.now();
      try {
        await client.db.premium.set(`${client.user.id}_test`, true);
        await client.db.premium.get(`${client.user.id}_test`);
        await client.db.premium.delete(`${client.user.id}_test`);
      } catch (e) {
        return "Error";
      }
      return Date.now() - start;
    };

    // Get all latency values
    const wsLatency = Math.round(client.ws.ping);
    const msgLatency = Math.round(Date.now() - message.createdTimestamp);
    const dbPing = await dbLatency();
    const player = await client.getPlayer(message.guild.id);
    const playerLatency = player?.shoukaku ? player.shoukaku.ping : "N/A";

    // Build Component V2 response
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.stats} Pong!`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.message} **Message:** \`${msgLatency}ms\`\n` +
        `${blackEmoji.link} **Websocket:** \`${wsLatency}ms\`\n` +
        `${blackEmoji.data} **Database:** \`${typeof dbPing === 'number' ? dbPing + 'ms' : 'Error'}\`\n` +
        `${blackEmoji.node} **Node:** \`${typeof playerLatency === 'number' ? playerLatency + 'ms' : 'N/A'}\``
      )
    );

    await m.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
