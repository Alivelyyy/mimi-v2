const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: 'removerole',
  aliases: ['rrole', 'massroleremove'],
  cooldown: '',
  category: 'moderation',
  usage: '<all|humans|bots> <@role>',
  description: 'Remove a role from all/humans/bots',
  args: true,
  vote: false, new: false, admin: false, owner: false,
  botPerms: ['ManageRoles'], userPerms: ['ManageRoles'],
  player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const type = args[0]?.toLowerCase();
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!['all', 'humans', 'bots'].includes(type) || !role) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.cog} Remove Role\n\n` +
        `${blackEmoji.arrow} \`${client.prefix}removerole all @role\` \u2014 Remove from everyone\n` +
        `${blackEmoji.arrow} \`${client.prefix}removerole humans @role\` \u2014 Remove from humans\n` +
        `${blackEmoji.arrow} \`${client.prefix}removerole bots @role\` \u2014 Remove from bots`
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    if (!role.editable) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} I cannot manage **${role.name}**.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const loadMsg = await message.reply({ components: [(() => { const c = new ContainerBuilder(); c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.loading} Removing role from ${type}...`)); return c; })()], flags: MessageFlags.IsComponentsV2 });

    let members = await message.guild.members.fetch();
    if (type === 'humans') members = members.filter(m => !m.user.bot);
    if (type === 'bots') members = members.filter(m => m.user.bot);
    let count = 0;
    for (const [, m] of members) {
      if (m.roles.cache.has(role.id)) { await m.roles.remove(role).catch(() => {}); count++; }
    }
    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Role Removed`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.arrow} Removed ${role} from **${count}** ${type}.\n` +
      `${blackEmoji.mod} **Moderator:** ${message.author.tag}`
    ));
    return loadMsg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
