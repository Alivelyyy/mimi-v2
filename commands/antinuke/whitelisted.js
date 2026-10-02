const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const Antinuke = require('@db/antinuke.js');

  module.exports = {
    name: 'whitelisted',
    aliases: ['wled', 'anwled'],
    cooldown: '',
    category: 'antinuke',
    usage: '',
    description: 'View all whitelisted users',
    args: false,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: ['Administrator'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message) => {
      const doc = await Antinuke.findOne({ guildId: message.guild.id });
      const list = doc?.whitelist || [];

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Whitelisted Users`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      if (list.length === 0) {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} No users are whitelisted.`));
      } else {
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(list.map((id, i) => `${blackEmoji.arrow} ${i + 1}. <@${id}> (\`${id}\`)`).join('\n')));
      }

      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  