const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const Giveaway = require('@db/giveaway.js');

  module.exports = {
    name: 'glist',
    aliases: ['gwlist', 'activegw'],
    cooldown: '',
    category: 'giveaway',
    usage: '',
    description: 'List active giveaways',
    args: false,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: ['ManageGuild'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message) => {
      const giveaways = await Giveaway.find({ guildId: message.guild.id, ended: false });
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.trophy} Active Giveaways`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        giveaways.length ? giveaways.map((g, i) => `${blackEmoji.arrow} ${i + 1}. **${g.prize}** in <#${g.channelId}> — Ends <t:${Math.floor(g.endsAt.getTime() / 1000)}:R>`).join('\n') : `${blackEmoji.info} No active giveaways.`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  