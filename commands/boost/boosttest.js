const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Boost = require('@db/boostSchema.js');
const { parseEmbeds } = require('@functions/embedParser.js');

module.exports = {
  name: 'boosttest',
  aliases: ['btest', 'testboost'],
  cooldown: '',
  category: 'boost',
  usage: '',
  description: 'Send a test boost message to the configured channel',
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: ['ManageGuild'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    try {
      const doc = await Boost.findOne({ guildId: message.guild.id });

      if (!doc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} No boost message configured. Use \`${client.prefix}setboost #channel\` first.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const channel = message.guild.channels.cache.get(doc.channelId);
      if (!channel) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} The configured boost channel no longer exists. Please run \`${client.prefix}setboost\` again.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const member = message.member;
      const placeholders = {
        user: member.toString(),
        username: member.user.username,
        usertag: member.user.tag,
        userid: member.user.id,
        useravatar: member.user.displayAvatarURL({ dynamic: true, size: 1024 }),
        server: message.guild.name,
        servericon: message.guild.iconURL({ dynamic: true, size: 1024 }),
        count: message.guild.memberCount.toString(),
        boostcount: (message.guild.premiumSubscriptionCount || 0).toString(),
        boosttier: (message.guild.premiumTier || 0).toString()
      };

      let parsed = doc.message;
      for (const [key, value] of Object.entries(placeholders)) {
        parsed = parsed.replace(new RegExp(`\\{${key}\\}`, 'gi'), value);
      }

      const { text: cleanText, embeds } = await parseEmbeds(parsed, message.guild.id, placeholders);

      if (embeds.length > 0) {
        const sendOpts = { embeds };
        if (cleanText) sendOpts.content = cleanText;
        await channel.send(sendOpts);
      } else {
        const boostContainer = new ContainerBuilder();
        boostContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.diamond} Server Boosted!`));
        boostContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        boostContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(parsed));
        boostContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
        boostContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`*— Test message sent by ${message.author.tag}*`));
        await channel.send({ components: [boostContainer], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Test boost message sent to ${channel}.`));
      await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
