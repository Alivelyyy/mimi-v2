const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
  const blackEmoji = require('@assets/emojis/black.js');
  const JoinDM = require('@db/joindm.js');

  module.exports = {
    name: 'joindm',
    aliases: ['jdm', 'joinmessage'],
    cooldown: '',
    category: 'joindm',
    usage: '<enable|disable|message|config>',
    description: 'Configure join DM messages',
    args: true,
    vote: false, new: false, admin: false, owner: false,
    botPerms: [], userPerms: ['ManageGuild'],
    player: false, queue: false, inVoiceChannel: false, sameVoiceChannel: false,
    execute: async (client, message, args) => {
      const action = args[0]?.toLowerCase();

      if (action === 'enable') {
        await JoinDM.findOneAndUpdate({ guildId: message.guild.id }, { $set: { enabled: true, updatedAt: new Date() } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Join DM has been **enabled**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'disable') {
        await JoinDM.findOneAndUpdate({ guildId: message.guild.id }, { $set: { enabled: false, updatedAt: new Date() } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Join DM has been **disabled**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'message') {
        const msg = args.slice(1).join(' ');
        if (!msg) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.info} **Usage:** \`${client.prefix}joindm message <your message>\`\n\n**Placeholders:** \`{user}\`, \`{username}\`, \`{server}\`, \`{count}\`\n**Embeds:** Add \`{embed:name}\` to include a custom embed.`));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
        await JoinDM.findOneAndUpdate({ guildId: message.guild.id }, { $set: { message: msg, updatedAt: new Date() } }, { upsert: true });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.yes} Join DM message has been **updated**.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      if (action === 'config') {
        const doc = await JoinDM.findOne({ guildId: message.guild.id });
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.message} Join DM Config`));
        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Status:** ${doc?.enabled ? blackEmoji.on : blackEmoji.off}\n` +
          `${blackEmoji.arrow} **Message:** ${doc?.message}`
        ));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# ${blackEmoji.message} Join DM\n\n` +
        `${blackEmoji.arrow} \`${client.prefix}joindm enable\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}joindm disable\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}joindm message <text>\`\n` +
        `${blackEmoji.arrow} \`${client.prefix}joindm config\``
      ));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }
  };
  