const { removeGuild } = require('@functions/updateBotGuilds.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

module.exports = {
  name: "guildDelete",
  execute: async (client, guild) => {
    try {
      const emoji = client.emoji;

      console.log(`${emoji.no} Left guild: ${guild.name} (${guild.id}) with ${guild.memberCount} members`);

      removeGuild(guild.id);

      if (client.webhooks.server) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### Left a Server`)
        );
        container.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Server Name:** ${guild.name}\n` +
            `**Server ID:** ${guild.id}\n` +
            `**Member Count:** ${guild.memberCount}`
          )
        );

        await client.webhooks.server.send({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
      }

    } catch (error) {
      console.error(`${client.emoji.no} Error in guildDelete event:`, error);
    }
  }
};
