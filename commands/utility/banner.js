
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

module.exports = {
  name: "banner",
  aliases: ['bn', 'userbanner'],
  cooldown: "5",
  category: "utility",
  description: "Shows user's banner",
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
    const targetId = message.mentions.users.first()?.id || args[0] || message.author.id;
    const user = await client.users.fetch(targetId, { force: true }).catch(() => null);

    if (!user) {
      return message.reply(`${client.emoji.no} User not found`);
    }

    const banner = user.bannerURL({ dynamic: true, size: 4096 });
    
    if (!banner) {
      return message.reply(`${client.emoji.no} ${user.tag} doesn't have a banner`);
    }

    const downloadLinks =
      `**Download:** [\`PNG\`](${user.bannerURL({ format: 'png', size: 4096 })}) | ` +
      `[\`JPG\`](${user.bannerURL({ format: 'jpg', size: 4096 })}) | ` +
      `[\`WEBP\`](${user.bannerURL({ format: 'webp', size: 4096 })}) | ` +
      `[\`GIF\`](${user.bannerURL({ format: 'gif', size: 4096 })})`;

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${user.tag}'s Banner`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(banner)));
    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${downloadLinks}\n-# Requested by ${message.author.tag}`));
    c.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Download')
          .setURL(banner)
      )
    );

    message.reply({
      components: [c],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
