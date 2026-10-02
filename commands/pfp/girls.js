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
  name: 'girls',
  aliases: ['gp', 'girlspfp'],
  cooldown: '3',
  category: 'pfp',
  usage: '',
  description: 'Get a random girls profile picture',
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
    loadingC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading} Searching for a girls profile picture...`));

    const msg = await message.reply({ components: [loadingC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const result = await fetchPfp('girls');

    if (!result) {
      const errC = new ContainerBuilder();
      errC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Could not fetch a profile picture right now. Please try again in a moment.`));
      return msg?.edit({ components: [errC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }

    const buildContainer = (imgResult) => {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${blackEmoji.user} Girls Profile Picture`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imgResult.url)));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Source: ${imgResult.source} • Requested by ${message.author.tag}`));
      c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('pfp_refresh_girls').setLabel('Next').setStyle(ButtonStyle.Primary).setEmoji(blackEmoji.cycle),
          new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Download').setURL(imgResult.url)
        )
      );
      return c;
    };

    await msg?.edit({ components: [buildContainer(result)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    const collector = msg?.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id && i.customId === 'pfp_refresh_girls',
      time: 120000,
      idle: 60000
    });

    collector?.on('collect', async (interaction) => {
      await interaction.deferUpdate();
      const newResult = await fetchPfp('girls');
      if (newResult) {
        await msg.edit({ components: [buildContainer(newResult)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    });

    collector?.on('end', async () => {
      const endC = new ContainerBuilder();
      endC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`Girls Profile Picture\n*Session ended — use \`${client.prefix}girls\` for a new one*`));
      await msg?.edit({ components: [endC], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  }
};
