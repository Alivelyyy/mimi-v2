
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "roleinfo",
  aliases: ['ri', 'rinfo'],
  cooldown: "5",
  category: "utility",
  description: "Shows information about a role",
  args: true,
  vote: false,
  new: false,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args) => {
    const role = message.mentions.roles.first() || 
                 message.guild.roles.cache.get(args[0]) ||
                 message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());

    if (!role) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} Please mention a role or provide a valid role ID/name`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const permissions = role.permissions.toArray()
      .map(p => `\`${p.toLowerCase().replace(/_/g, ' ')}\``)
      .join(', ');

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.info} Role Information: ${role.name}`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**General Info**\n` +
        `**Name:** ${role.name}\n` +
        `**ID:** ${role.id}\n` +
        `**Color:** ${role.hexColor.toUpperCase()}\n` +
        `**Position:** ${role.position}\n` +
        `**Members:** ${role.members.size}\n` +
        `**Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:R>\n` +
        `**Mentionable:** ${role.mentionable ? 'Yes' : 'No'}\n` +
        `**Hoisted:** ${role.hoist ? 'Yes' : 'No'}\n` +
        `**Managed:** ${role.managed ? 'Yes' : 'No'}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Key Permissions**\n${permissions}`
      )
    );

    message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
};
