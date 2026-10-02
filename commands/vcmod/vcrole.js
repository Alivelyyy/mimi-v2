const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const VCRole = require('@db/vcrole.js');

  module.exports = {
    name: 'vcrole',
    aliases: ['vcr', 'voicerole'],
    cooldown: '',
    category: 'vcmod',
    usage: '<add|remove|config>',
    description: 'Assign a role when a user joins a VC',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: ['ManageRoles'], userPerms: ['ManageRoles'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const action = args[0]?.toLowerCase();

      if (action === 'add') {
        const vcId = args[1];
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);
        if (!vcId || !role) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}vcrole add <vcChannelId> @role\``));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await VCRole.findOneAndUpdate({ guildId: message.guild.id, voiceChannelId: vcId }, { $set: { roleId: role.id } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Users joining <#${vcId}> will get ${role}.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'remove') {
        const vcId = args[1];
        if (!vcId) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}vcrole remove <vcChannelId>\``));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await VCRole.deleteOne({ guildId: message.guild.id, voiceChannelId: vcId });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} VC role for <#${vcId}> has been **removed**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'config') {
        const docs = await VCRole.find({ guildId: message.guild.id });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.mic} VC Roles`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          docs.length ? docs.map((d, i) => `${blackEmoji.arrow} ${i + 1}. <#${d.voiceChannelId}> → <@&${d.roleId}>`).join('\n') : `${blackEmoji.info} No VC roles configured.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.mic} VC Roles\n\n` +
        `${blackEmoji.arrow} \`${client.prefix}vcrole add <vcId> @role\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}vcrole remove <vcId>\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}vcrole config\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  