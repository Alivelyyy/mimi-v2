const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "servericon",
  aliases: ['sicon', 'serverpic'],
  cooldown: "5",
  category: "utility",
  description: "Shows the server's icon",
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,

  execute: async (client, message) => {
    const guild = message.guild;
    const icon = guild.iconURL({ dynamic: true, size: 4096 });

    if (!icon) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} This server doesn't have an icon.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.server} ${guild.name}'s Icon`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(icon))
    );
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Download Links:**\n` +
      `[\`PNG\`](${guild.iconURL({ format: 'png', size: 4096 })}) | ` +
      `[\`JPG\`](${guild.iconURL({ format: 'jpg', size: 4096 })}) | ` +
      `[\`WEBP\`](${guild.iconURL({ format: 'webp', size: 4096 })}) | ` +
      `[\`GIF\`](${guild.iconURL({ format: 'gif', size: 4096 })})`
    ));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Download').setURL(icon)
      )
    );

    message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
