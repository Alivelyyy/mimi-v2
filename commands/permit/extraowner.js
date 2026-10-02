const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const ExtraOwner = require('@db/extraowner.js');

  module.exports = {
    name: 'extraowner',
    aliases: ['eo', 'eown'],
    cooldown: '',
    category: 'permit',
    usage: '<set|view|reset>',
    description: 'Manage extra owners',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: ['Administrator'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      if (message.guild.ownerId !== message.author.id) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Only the **server owner** can manage extra owners.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const action = args[0]?.toLowerCase();

      if (action === 'set') {
        const user = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
        if (!user) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid user.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await ExtraOwner.findOneAndUpdate({ guildId: message.guild.id }, { $addToSet: { owners: user.id }, $set: { updatedAt: new Date() } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} **${user.tag}** has been added as an extra owner.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'view') {
        const doc = await ExtraOwner.findOne({ guildId: message.guild.id });
        const owners = doc?.owners || [];
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.owner} Extra Owners`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          owners.length ? owners.map((id, i) => `${blackEmoji.arrow} ${i + 1}. <@${id}>`).join('\n') : `${blackEmoji.info} No extra owners set.`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'reset') {
        await ExtraOwner.findOneAndUpdate({ guildId: message.guild.id }, { $set: { owners: [] } });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Extra owners have been **reset**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.owner} Extra Owner\n\n` +
        `${blackEmoji.arrow} \`${client.prefix}extraowner set @user\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}extraowner view\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}extraowner reset\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  