const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const LbSettings = require('@db/lbSettings.js');

  module.exports = {
    name: 'voicelb',
    aliases: ['vlb', 'voicetrack'],
    cooldown: '',
    category: 'leaderboard',
    usage: '<on|off>',
    description: 'Enable or disable voice leaderboard tracking',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: ['ManageGuild'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const action = args[0]?.toLowerCase();
      if (!['on', 'off'].includes(action)) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}voicelb <on|off>\``));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
      await LbSettings.findOneAndUpdate({ guildId: message.guild.id }, { $set: { voiceLb: action === 'on', updatedAt: new Date() } }, { upsert: true });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Voice leaderboard tracking is now **${action === 'on' ? 'enabled' : 'disabled'}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  