const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Welcome = require('@db/welcomeSchema.js');

module.exports = {
  name: 'welcometest',
  aliases: ['wt', 'testwelcome'],
  cooldown: '',
  category: 'welcome',
  usage: '',
  description: 'Send a test welcome message to the configured channel',
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
      const doc = await Welcome.findOne({ guildId: message.guild.id });

      if (!doc) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.no} No welcome message configured. Use \`${client.prefix}setwelcome #channel\` first.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const channel = message.guild.channels.cache.get(doc.channelId);
      if (!channel) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} The configured welcome channel no longer exists. Please run \`${client.prefix}setwelcome\` again.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const member = message.member;
      const parsed = doc.message
        .replace(/{user}/g, member.toString())
        .replace(/{username}/g, member.user.username)
        .replace(/{server}/g, message.guild.name)
        .replace(/{count}/g, message.guild.memberCount.toString());

      const welcomeContainer = new ContainerBuilder();
      welcomeContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.bell} Welcome!`));
      welcomeContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      welcomeContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(parsed));
      welcomeContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      welcomeContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`*— Test message sent by ${message.author.tag}*`));

      await channel.send({ components: [welcomeContainer], flags: MessageFlags.IsComponentsV2 });

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Test welcome message sent to ${channel}.`));
      await message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
      message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
