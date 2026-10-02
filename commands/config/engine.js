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
  name: "engine",
  aliases: ['eng', 'searchengine'],
  cooldown: "3",
  category: "config",
  usage: "[spotify/youtube/deezer/apple]",
  description: "Set your default music search engine",
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
    const musicSource = require("@db/musicSource.js");
    const validEngines = ["spotify", "youtube", "deezer", "apple"];

    const engineEmojis = {
      spotify: blackEmoji.spotify,
      youtube: blackEmoji.youtube,
      deezer: blackEmoji.music,
      apple: blackEmoji.music
    };

    if (!args[0]) {
      const currentEngine = await musicSource.get(`${message.author.id}`) || "youtube";

      const engineRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("set_spotify").setLabel("Spotify").setStyle(currentEngine === "spotify" ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("set_youtube").setLabel("YouTube").setStyle(currentEngine === "youtube" ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("set_deezer").setLabel("Deezer").setStyle(currentEngine === "deezer" ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("set_apple").setLabel("Apple Music").setStyle(currentEngine === "apple" ? ButtonStyle.Success : ButtonStyle.Secondary)
      );

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.search} Music Search Engine`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${blackEmoji.cog} Current Settings\n` +
          `> ${engineEmojis[currentEngine]} **Active Engine:** ${currentEngine.charAt(0).toUpperCase() + currentEngine.slice(1)}\n\n` +
          `### ${blackEmoji.heart} Available Engines\n` +
          `> ${blackEmoji.spotify} **Spotify** - High quality music search\n` +
          `> ${blackEmoji.youtube} **YouTube** - Largest music library\n` +
          `> ${blackEmoji.deezer} **Deezer** - Premium audio quality\n` +
          `> ${blackEmoji.apple} **Apple Music** - Curated playlists\n\n` +
          `${blackEmoji.arrow} Select your preferred engine below:`
        )
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      container.addActionRowComponents(engineRow);

      const msg = await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });

      try {
        const interaction = await msg.awaitMessageComponent({
          time: 30000,
          filter: (i) => i.user.id === message.author.id,
        });

        const selectedEngine = interaction.customId.replace("set_", "");
        await musicSource.set(`${message.author.id}`, selectedEngine);

        const successContainer = new ContainerBuilder();
        successContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Engine Updated`)
        );
        successContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        successContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `Default search engine set to **${selectedEngine.toUpperCase()}**\n\n` +
            `All future \`${client.prefix}play\` commands will use this engine automatically!`
          )
        );

        await interaction.update({
          components: [successContainer],
          flags: MessageFlags.IsComponentsV2
        });
      } catch (err) {
        await msg.edit({ components: [] }).catch(() => {});
      }
    } else {
      const engine = args[0].toLowerCase();

      if (!validEngines.includes(engine)) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.error} Invalid Engine`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `Please choose from: \`spotify\`, \`youtube\`, \`deezer\`, or \`apple\``
          )
        );

        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2
        });
      }

      await musicSource.set(`${message.author.id}`, engine);

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Engine Updated`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Default search engine set to **${engine.toUpperCase()}**\n\n` +
          `All future \`${client.prefix}play\` commands will use this engine automatically!`
        )
      );

      await message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }
  },
};