const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const LbBlacklist = require('@db/lbBlacklist.js');
const LbSettings = require('@db/lbSettings.js');

module.exports = {
  name: 'lblist',
  aliases: ['lbcfg', 'lbsettings'],
  cooldown: '',
  category: 'leaderboard',
  usage: '',
  description: 'View leaderboard configuration and blacklisted channels',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: [], userPerms: ['ManageGuild'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message) => {
    const settings = await LbSettings.findOne({ guildId: message.guild.id });
    const blacklisted = await LbBlacklist.find({ guildId: message.guild.id });

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `# ${blackEmoji.cog} Leaderboard Configuration`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const voiceStatus = settings?.voiceLb ? (blackEmoji.on) : (blackEmoji.off);
    const msgStatus = settings?.messageLb ? (blackEmoji.on) : (blackEmoji.off);
    const invStatus = settings?.inviteLb ? (blackEmoji.on) : (blackEmoji.off);

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Tracking Status:**\n` +
      `${voiceStatus} Voice Leaderboard — \`${client.prefix}voicelb on/off\`\n` +
      `${msgStatus} Message Leaderboard — \`${client.prefix}msglb on/off\`\n` +
      `${invStatus} Invite Leaderboard — \`${client.prefix}invitelb on/off\``
    ));

    if (settings?.altThreshold) {
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `\n${blackEmoji.warn} **Alt Threshold:** Accounts younger than ${Math.floor(settings.altThreshold / 86400000)}d are flagged as fake invites`
      ));
    }

    if (blacklisted.length > 0) {
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      const channels = blacklisted.filter(b => b.type === 'channel');
      const categories = blacklisted.filter(b => b.type === 'category');

      let text = '**Blacklisted:**\n';
      if (channels.length) {
        text += channels.map(b => `${blackEmoji.channel} <#${b.targetId}>`).join('\n') + '\n';
      }
      if (categories.length) {
        text += categories.map(b => {
          const cat = message.guild.channels.cache.get(b.targetId);
          return `${blackEmoji.list} ${cat?.name || b.targetId} (category)`;
        }).join('\n');
      }
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
    } else {
      c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# No blacklisted channels`
      ));
    }

    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
