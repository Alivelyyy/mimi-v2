const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');

  module.exports = {
    name: 'list',
    aliases: ['ls', 'members'],
    cooldown: '',
    category: 'information',
    usage: '<boosters|inrole|emojis|bots|admins|mods|roles|early|activedeveloper>',
    description: 'List server members by category',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: [],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const type = args[0]?.toLowerCase();
      const guild = message.guild;

      if (type === 'boosters') {
        const boosters = guild.members.cache.filter(m => m.premiumSince);
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.diamond} Server Boosters [${boosters.size}]`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          boosters.size ? boosters.map(m => `${blackEmoji.arrow} ${m.user.tag}`).join('\n').slice(0, 3900) : `${blackEmoji.info} No boosters.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (type === 'inrole') {
        const role = message.mentions.roles.first() || guild.roles.cache.get(args[1]);
        if (!role) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        const members = role.members;
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Members in ${role.name} [${members.size}]`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          members.size ? members.map(m => `${blackEmoji.arrow} ${m.user.tag}`).join('\n').slice(0, 3900) : `${blackEmoji.info} No members.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (type === 'emojis') {
        const emojis = guild.emojis.cache;
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Server Emojis [${emojis.size}]`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          emojis.size ? emojis.map(e => `${e}`).join(' ').slice(0, 3900) : `${blackEmoji.info} No custom emojis.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (type === 'bots') {
        const bots = guild.members.cache.filter(m => m.user.bot);
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.bot} Server Bots [${bots.size}]`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          bots.map(m => `${blackEmoji.arrow} ${m.user.tag}`).join('\n').slice(0, 3900)
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (type === 'admins') {
        const admins = guild.members.cache.filter(m => m.permissions.has('Administrator') && !m.user.bot);
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.admin} Admins [${admins.size}]`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          admins.size ? admins.map(m => `${blackEmoji.arrow} ${m.user.tag}`).join('\n').slice(0, 3900) : `${blackEmoji.info} None.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (type === 'mods') {
        const mods = guild.members.cache.filter(m => m.permissions.has('ModerateMembers') && !m.user.bot && !m.permissions.has('Administrator'));
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.mod} Moderators [${mods.size}]`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          mods.size ? mods.map(m => `${blackEmoji.arrow} ${m.user.tag}`).join('\n').slice(0, 3900) : `${blackEmoji.info} None.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (type === 'roles') {
        const roles = guild.roles.cache.sort((a, b) => b.position - a.position);
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Server Roles [${roles.size}]`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          roles.map(r => `${r}`).join(', ').slice(0, 3900)
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.list} List Commands\n\n` +
        `${blackEmoji.arrow} \`${client.prefix}list boosters\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}list inrole @role\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}list emojis\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}list bots\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}list admins\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}list mods\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}list roles\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  