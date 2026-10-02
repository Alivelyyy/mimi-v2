const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'nick',
  aliases: ['nickname', 'sn'],
  cooldown: '',
  category: 'moderation',
  usage: '<@user> [new nickname]',
  description: 'Change or reset a member\'s nickname',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageNicknames'], userPerms: ['ManageNicknames'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const member = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!member) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid member.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (!member.manageable) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} I cannot change the nickname of **${member.user.tag}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const oldNick = member.nickname || member.user.username;
    const newNick = args.slice(1).join(' ') || null;

    try {
      await member.setNickname(newNick, `Changed by ${message.author.tag}`);

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Nickname ${newNick ? 'Changed' : 'Reset'}`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `${blackEmoji.user} **User:** ${member.user.tag}\n` +
        `${blackEmoji.arrow} **Before:** \`${oldNick}\`\n` +
        `${blackEmoji.arrow} **After:** \`${newNick || member.user.username}\`\n` +
        `${blackEmoji.mod} **Changed by:** ${message.author.tag}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  }
};
