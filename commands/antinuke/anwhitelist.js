const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');
const Antinuke = require('@db/antinuke.js');

module.exports = {
  name: 'anwhitelist',
  aliases: ['anwl', 'nwl'],
  cooldown: '',
  category: 'antinuke',
  usage: '<add|remove|list> [@user]',
  description: 'Manage the anti-nuke whitelist',
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: ['Administrator'],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const isOwner = message.guild.ownerId === message.author.id;
    if (!isOwner) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Only the **server owner** can manage the anti-nuke whitelist.`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const action = args[0]?.toLowerCase();

    if (action === 'list') {
      try {
        const doc = await Antinuke.findOne({ guildId: message.guild.id });
        const whitelist = doc?.whitelist || [];

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${blackEmoji.list} Anti-Nuke Whitelist`));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

        if (whitelist.length === 0) {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${blackEmoji.info} No users are whitelisted. Whitelisted users bypass anti-nuke checks.`
          ));
        } else {
          container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            whitelist.map((id, i) => `**${i + 1}.** <@${id}> (\`${id}\`)`).join('\n')
          ));
        }
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      } catch (err) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
    }

    if (action === 'add' || action === 'remove') {
      const target = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
      if (!target) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a valid user.`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }

      try {
        if (action === 'add') {
          await Antinuke.findOneAndUpdate(
            { guildId: message.guild.id },
            { $addToSet: { whitelist: target.id }, updatedAt: new Date() },
            { upsert: true }
          );
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${blackEmoji.yes} **${target.tag}** has been added to the anti-nuke whitelist.`
          ));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        } else {
          await Antinuke.findOneAndUpdate(
            { guildId: message.guild.id },
            { $pull: { whitelist: target.id }, updatedAt: new Date() },
            { upsert: true }
          );
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `${blackEmoji.yes} **${target.tag}** has been removed from the anti-nuke whitelist.`
          ));
          return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
      } catch (err) {
        const c = new ContainerBuilder();
        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.no} Failed: ${err.message}`));
        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
      }
    }

    const c = new ContainerBuilder();
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${blackEmoji.info} Usage: \`${client.prefix}anwhitelist <add|remove|list> [@user]\``
    ));
    message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
  }
};
