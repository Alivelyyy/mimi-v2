const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { fetchPfp } = require('@utils/pfpFetcher.js');

module.exports = {
  name: 'couples',
  aliases: ['cp', 'couplespfp'],
  cooldown: '3',
  category: 'pfp',
  usage: '',
  description: 'Get a random couples profile picture pair',
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
  execute: async (client, message) => {
    const loadingC = new ContainerBuilder();
    loadingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading} Searching for a couples profile picture pair...`));

    const msg = await message.reply({ components: [loadingC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const [result1, result2] = await Promise.all([fetchPfp('girls'), fetchPfp('boys')]);

    if (!result1 && !result2) {
      const errC = new ContainerBuilder();
      errC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Could not fetch profile pictures right now. Please try again in a moment.`));
      return msg?.edit({ components: [errC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    const buildContainer = (img1, img2) => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${blackEmoji.user} Couples Profile Pictures`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      const galleryItems = [];
      if (img1) galleryItems.push(new MediaGalleryItemBuilder().setURL(img1.url).setDescription('Couple #1'));
      if (img2) galleryItems.push(new MediaGalleryItemBuilder().setURL(img2.url).setDescription('Couple #2'));
      if (galleryItems.length > 0) {
        c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(...galleryItems));
      }

      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      const sources = [img1 && `#1: ${img1.source}`, img2 && `#2: ${img2.source}`].filter(Boolean).join(' • ');
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${sources} • Requested by ${message.author.tag}`));

      const buttons = [
        new ButtonBuilder().setCustomId('pfp_refresh_couples').setLabel('Next Pair').setStyle(ButtonStyle.Primary).setEmoji(blackEmoji.cycle)
      ];
      if (img1) buttons.push(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Download 1').setURL(img1.url));
      if (img2) buttons.push(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Download 2').setURL(img2.url));
      c.addActionRowComponents(new ActionRowBuilder().addComponents(...buttons));

      return c;
    };

    await msg?.edit({ components: [buildContainer(result1, result2)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const collector = msg?.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id && i.customId === 'pfp_refresh_couples',
      time: 120000,
      idle: 60000
    });

    collector?.on('collect', async (interaction) => {
      await interaction.deferUpdate();
      const [newResult1, newResult2] = await Promise.all([fetchPfp('girls'), fetchPfp('boys')]);
      if (newResult1 || newResult2) {
        await msg.edit({ components: [buildContainer(newResult1, newResult2)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });

    collector?.on('end', async () => {
      const endC = new ContainerBuilder();
      endC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`Couples Profile Pictures\n*Session ended — use \`${client.prefix}couples\` for a new pair*`));
      await msg?.edit({ components: [endC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  }
};
