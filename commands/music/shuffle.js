const { 
  ContainerBuilder, 
  TextDisplayBuilder, 
  SeparatorBuilder, 
  SeparatorSpacingSize,
  MessageFlags 
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "shuffle",
  aliases: ['sh', 'mix'],
  cooldown: "",
  category: "music",
  usage: "",
  description: "shuffle the queue",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: true,
  queue: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (client, message, args, prefix) => {
    const player = await client.getPlayer(message.guild.id);
    
    // Filter out autoplay tracks before shuffling if they were somehow added to the main queue array
    // though usually they are added at the end. We just shuffle what's there but queue command will hide them.
    // To be safe, we can manually shuffle only non-autoplay tracks if needed, but standard shuffle is fine
    // as long as the display (queue cmd) respects the hidden status.
    
    const queueLength = player.queue.filter(t => !t.isAutoplay).length;

    await player.queue.shuffle();
    
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.queue} Queue Shuffled`)
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.arrow} **Tracks shuffled:** ${queueLength}\n` +
        `${blackEmoji.arrow} **Shuffled by:** ${message.author}\n` +
        `${blackEmoji.arrow} Use \`${client.prefix}queue\` to see the new order`
      )
    );
    
    await message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .then(async () => {
        await client.commands
          .get("queue")
          .execute(client, message, args, blackEmoji.queue);
      })
      .catch(() => {});
  },
};
