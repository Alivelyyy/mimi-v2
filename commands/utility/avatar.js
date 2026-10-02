
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

module.exports = {
  name: "avatar",
  aliases: ['av', 'pfp2'],
  cooldown: "5",
  category: "utility", 
  description: "Shows user's avatar in different formats and sizes",
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
      return message.reply(`${blackEmoji.no} User not found`);
    }

    const member = message.guild.members.cache.get(user.id) || await message.guild.members.fetch(user.id).catch(() => null);
    
    const userAvatar = user.displayAvatarURL({ dynamic: true, size: 4096 });
    const serverAvatar = member?.displayAvatarURL({ dynamic: true, size: 4096 });
    const hasServerAvatar = member && userAvatar !== serverAvatar;
    
    const uid = `av_${message.id}`;

    const buildContainer = (isServer) => {
      const isServerMode = isServer && hasServerAvatar;
      const url = isServerMode ? serverAvatar : userAvatar;
      const title = isServerMode ? `${user.tag}'s Server Avatar` : `${user.tag}'s Avatar`;
      const target = isServerMode ? member : user;
      const downloadLinks =
        `**Download:** [\`PNG\`](${target.displayAvatarURL({ format: 'png', size: 4096 })}) | ` +
        `[\`JPG\`](${target.displayAvatarURL({ format: 'jpg', size: 4096 })}) | ` +
        `[\`WEBP\`](${target.displayAvatarURL({ format: 'webp', size: 4096 })}) | ` +
        `[\`GIF\`](${target.displayAvatarURL({ format: 'gif', size: 4096 })})`;

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${downloadLinks}\n-# Requested by ${message.author.tag}`));
      c.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`${uid}_global`)
            .setLabel('Global Avatar')
            .setStyle(isServerMode ? ButtonStyle.Secondary : ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`${uid}_server`)
            .setLabel('Server Avatar')
            .setStyle(isServerMode ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(!hasServerAvatar),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Download')
            .setURL(url)
        )
      );
      return c;
    };

    const msg = await message.reply({
      components: [buildContainer(false)],
      flags: MessageFlags.IsComponentsV2
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();
      const isServer = interaction.customId === `${uid}_server`;
      await msg.edit({
        components: [buildContainer(isServer)],
        flags: MessageFlags.IsComponentsV2
      });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  }
};
