const {
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
  name: "snipe",
  aliases: ['sn2', 'lastmessage'],
  cooldown: "5",
  category: "utility",
  description: "Shows the last deleted message in the channel",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: ['ManageMessages'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message) => {
    const snipe = client.snipes.get(message.channel.id);

    if (!snipe) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} No recently deleted messages found in this channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const ts = Math.floor((snipe.createdAt instanceof Date ? snipe.createdAt.getTime() : snipe.createdAt) / 1000);

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.search} Sniped Message`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.user} **Author:** ${snipe.author.tag} (\`${snipe.author.id}\`)\n` +
      `${blackEmoji.time} **Deleted:** <t:${ts}:R>\n` +
      (snipe.content ? `\n${blackEmoji.message} **Content:**\n${snipe.content.slice(0, 1500)}` : '*No text content*')
    ));

    if (snipe.image) {
      container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(snipe.image)
        )
      );
    }

    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`*${blackEmoji.info} Snipes expire after 5 minutes*`));

    message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
