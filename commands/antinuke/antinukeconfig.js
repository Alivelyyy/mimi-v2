const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Antinuke = require('@db/antinuke.js');
const { MODULE_INFO } = require('../../plugins/antinuke.js');

module.exports = {
  name: 'antinukeconfig',
  aliases: ['anconfig', 'ancfg'],
  cooldown: '5',
  category: 'antinuke',
  usage: '',
  description: 'View anti-nuke configuration and all module statuses',
  args: false,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['Administrator'], userPerms: ['Administrator'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message) => {
    const doc = await Antinuke.findOne({ guildId: message.guild.id });
    const on = blackEmoji.on;
    const off = blackEmoji.off;

    let moduleLines = '';
    for (const [key, info] of Object.entries(MODULE_INFO)) {
      const mod = doc?.modules?.[key];
      const enabled = mod?.enabled ?? true;
      const limitStr = info.hasLimit ? ` — Limit: \`${mod?.limit ?? 3}\`` : '';
      moduleLines += `> ${enabled ? on : off} **${info.label}**${limitStr}\n`;
    }

    const logCh = doc?.logChannelId ? `<#${doc.logChannelId}>` : 'Not set';
    const qRole = doc?.quarantineRoleId ? `<@&${doc.quarantineRoleId}>` : 'Not set';

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `# ${blackEmoji.danger} Anti-Nuke Configuration\n` +
      `${blackEmoji.arrow} **Status:** ${doc?.enabled ? `${on} Active` : `${off} Inactive`}\n` +
      `${blackEmoji.arrow} **Punishment:** \`${doc?.punishment}\`\n` +
      `${blackEmoji.arrow} **Log Channel:** ${logCh}\n` +
      `${blackEmoji.arrow} **Quarantine Role:** ${qRole}\n` +
      `${blackEmoji.arrow} **Whitelisted:** ${doc?.whitelist?.length || 0} users\n\n` +
      `### Modules\n${moduleLines}`
    ));
    return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  },
};
