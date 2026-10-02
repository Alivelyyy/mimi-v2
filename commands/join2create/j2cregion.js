const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const { J2CChannel } = require('@db/join2create.js');

const VALID_REGIONS = [
  'brazil', 'hongkong', 'india', 'japan', 'rotterdam',
  'russia', 'singapore', 'south-korea', 'southafrica',
  'sydney', 'us-central', 'us-east', 'us-south', 'us-west',
  'auto'
];

module.exports = {
  name: 'j2cregion',
  aliases: ['j2cr2', 'vcregion'],
  cooldown: '',
  category: 'join2create',
  usage: '<region|auto>',
  description: 'Change the voice region for your Join-to-Create channel',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageChannels'], userPerms: [],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const vcDoc = await J2CChannel.findOne({ guildId: message.guild.id, ownerId: message.author.id });
    if (!vcDoc) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} You don't own a Join-to-Create channel.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const channel = message.guild.channels.cache.get(vcDoc.channelId);
    if (!channel) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Your channel no longer exists.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const region = args[0]?.toLowerCase();
    if (!VALID_REGIONS.includes(region)) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Available Regions`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          VALID_REGIONS.map(r => `> ${blackEmoji.arrow} \`${r}\``).join('\n')
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    try {
      const rtcRegion = region === 'auto' ? null : region;
      await channel.setRTCRegion(rtcRegion, `J2C region by ${message.author.tag}`);
      await J2CChannel.updateOne({ _id: vcDoc._id }, { region: rtcRegion });

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.yes} Voice region set to **${region === 'auto' ? 'Automatic' : region}** for **${channel.name}**.`
      ));
      await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed to set region: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
