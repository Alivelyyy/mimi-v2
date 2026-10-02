const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { fetchAnimePfp } = require('@utils/pfpFetcher.js');

const ANIME_CATEGORIES = {
  neko: { label: 'Neko', emoji: blackEmoji.neko, api: 'https://nekos.best/api/v2/neko' },
  waifu: { label: 'Waifu', emoji: blackEmoji.pinkHeart, api: 'https://nekos.best/api/v2/waifu' },
  husbando: { label: 'Husbando', emoji: blackEmoji.blueHeart, api: 'https://nekos.best/api/v2/husbando' },
  kitsune: { label: 'Kitsune', emoji: blackEmoji.fox, api: 'https://nekos.best/api/v2/kitsune' },
};

module.exports = {
  name: 'anime',
  aliases: ['anipfp', 'animepic'],
  cooldown: '3',
  category: 'pfp',
  usage: '[neko|waifu|husbando|kitsune]',
  description: 'Get a random anime profile picture from various categories',
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
  execute: async (client, message, args) => {
    let selectedCategory = args[0]?.toLowerCase();
    if (!selectedCategory || !ANIME_CATEGORIES[selectedCategory]) {
      selectedCategory = 'neko';
    }

    const loadingC = new ContainerBuilder();
    loadingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading} Fetching **${ANIME_CATEGORIES[selectedCategory].label}** profile picture...`));

    const msg = await message.reply({ components: [loadingC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const result = await fetchAnimePfp(selectedCategory);

    if (!result) {
      const errC = new ContainerBuilder();
      errC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Could not fetch an anime profile picture right now. Please try again in a moment.`));
      return msg?.edit({ components: [errC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    const buildContainer = (imgResult, category) => {
      const catInfo = ANIME_CATEGORIES[category] || ANIME_CATEGORIES.neko;
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${catInfo.emoji} Anime PFP — ${catInfo.label}`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imgResult.url)));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Source: ${imgResult.source} • Requested by ${message.author.tag}`));
      c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('pfp_refresh_anime').setLabel('Next').setStyle(ButtonStyle.Primary).setEmoji(blackEmoji.cycle),
          new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Download').setURL(imgResult.url)
        )
      );
      c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('pfp_anime_category')
            .setPlaceholder('Switch Category')
            .addOptions(
              Object.entries(ANIME_CATEGORIES).map(([key, val]) => ({
                label: val.label,
                value: key,
                emoji: val.emoji,
                default: key === category
              }))
            )
        )
      );
      return c;
    };

    await msg?.edit({ components: [buildContainer(result, selectedCategory)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const collector = msg?.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 120000,
      idle: 60000
    });

    collector?.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      if (interaction.customId === 'pfp_anime_category') {
        selectedCategory = interaction.values[0];
      }

      const newResult = await fetchAnimePfp(selectedCategory);
      if (newResult) {
        await msg.edit({ components: [buildContainer(newResult, selectedCategory)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });

    collector?.on('end', async () => {
      const endC = new ContainerBuilder();
      endC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.neko} Anime Profile Picture\n*Session ended — use \`${client.prefix}anime\` for a new one*`));
      await msg?.edit({ components: [endC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  }
};
