const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const Giveaway = require('@db/giveaway.js');

  module.exports = {
    name: 'gconfig',
    aliases: ['gcfg', 'gwconfig'],
    cooldown: '',
    category: 'giveaway',
    usage: '',
    description: 'View giveaway system config',
    args: false,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: ['ManageGuild'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message) => {
      const active = await Giveaway.countDocuments({ guildId: message.guild.id, ended: false });
      const total = await Giveaway.countDocuments({ guildId: message.guild.id });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} Giveaway Config\n\n` +
        `${blackEmoji.arrow} **Active Giveaways:** ${active}\n` +
        `${blackEmoji.arrow} **Total Giveaways:** ${total}`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  