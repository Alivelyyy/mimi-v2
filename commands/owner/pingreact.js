const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

module.exports = {
  name: "pingreact",
  aliases: ['pr', 'pingreaction'],
  cooldown: "",
  category: "owner",
  usage: "[enable/disable]",
  description: "Enable or disable ping reactions for this server",
  args: false,
  vote: false,
  new: false,
  admin: false,
  owner: true,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const action = args[0]?.toLowerCase();
    const guildId = message.guild.id;
    
    const currentStatus = await client.db.premium.get(`pingreact_${guildId}`) || false;
    
    if (!action) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.bell} Ping Reactions`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${blackEmoji.arrow} **Current Status:** ${currentStatus ? `${blackEmoji.on} Enabled` : `${blackEmoji.off} Disabled`}\n` +
          `${blackEmoji.arrow} **Server:** ${message.guild.name}\n\n` +
          `${blackEmoji.info} **Usage:** \`${client.prefix}pingreact <enable/disable>\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
    
    switch (action) {
      case 'enable':
      case 'on':
        if (currentStatus) {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Already Enabled`)
          );
          container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} Ping reactions are already enabled for this server`
            )
          );
          return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          });
        }
        
        await client.db.premium.set(`pingreact_${guildId}`, true);
        const enableContainer = new ContainerBuilder();
        enableContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Ping Reactions Enabled`)
        );
        enableContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        enableContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} **Status:** ${blackEmoji.on} Enabled\n` +
            `${blackEmoji.arrow} **Server:** ${message.guild.name}`
          )
        );
        return message.reply({
          components: [enableContainer],
          flags: MessageFlags.IsComponentsV2,
        });
        
      case 'disable':
      case 'off':
        if (!currentStatus) {
          const container = new ContainerBuilder();
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Already Disabled`)
          );
          container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
          );
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${blackEmoji.arrow} Ping reactions are already disabled for this server`
            )
          );
          return message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
          });
        }
        
        await client.db.premium.delete(`pingreact_${guildId}`);
        const disableContainer = new ContainerBuilder();
        disableContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.yes} Ping Reactions Disabled`)
        );
        disableContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        disableContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} **Status:** ${blackEmoji.off} Disabled\n` +
            `${blackEmoji.arrow} **Server:** ${message.guild.name}`
          )
        );
        return message.reply({
          components: [disableContainer],
          flags: MessageFlags.IsComponentsV2,
        });
        
      default:
        const errorContainer = new ContainerBuilder();
        errorContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.no} Invalid Option`)
        );
        errorContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        errorContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${blackEmoji.arrow} **Valid options:** \`enable\`, \`disable\`, \`on\`, \`off\`\n` +
            `${blackEmoji.arrow} **Usage:** \`${client.prefix}pingreact <enable/disable>\``
          )
        );
        return message.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2,
        });
    }
  },
};
