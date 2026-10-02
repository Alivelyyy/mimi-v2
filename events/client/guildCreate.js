const { ActionRowBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { addGuild } = require('@functions/updateBotGuilds.js');
const blackEmoji = require('@assets/emojis/black.js');

module.exports = {
  name: "guildCreate",
  run: async (client, guild) => {
    if (!guild.name) return;
    
    addGuild(guild.id);
    
    // DM to owner using Components V2
    const ownerContainer = new ContainerBuilder();
    ownerContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# Thank you for choosing ${client.user.username}!`
      )
    );
    ownerContainer.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    ownerContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `\`${client.user.username}\` has been successfully added to \`${guild.name}\``
      )
    );
    ownerContainer.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    ownerContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${blackEmoji.point} Report issues at our [Support Server](${client.support})\n` +
        `${blackEmoji.point} Contact our [Developers](${client.support}) for more info`
      )
    );

    try {
      const owner = await client.users.fetch(guild.ownerId);
      await owner.send({
        components: [ownerContainer],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    } catch (e) {}
    
    // Welcome message in guild using Components V2
    const channel = guild.channels.cache.find(
      ch =>
        ch.type === 0 &&
        ch.permissionsFor(guild.members.me).has(["SendMessages", "ViewChannel", "EmbedLinks"])
    );

    if (channel) {
      const welcomeContainer = new ContainerBuilder();
      welcomeContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# Thanks for adding ${client.user.username}!`
        )
      );
      welcomeContainer.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );
      welcomeContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Hey everyone! Thanks for adding me to **${guild.name}**!`
        )
      );
      welcomeContainer.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      welcomeContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `I'm a feature-rich music bot with:\n\n` +
          `${blackEmoji.music} High quality music playback\n` +
          `${blackEmoji.filter} Advanced audio filters\n` +
          `${blackEmoji.config} Custom server settings`
        )
      );
      welcomeContainer.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      welcomeContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Use \`${client.prefix}help\` to see all my commands!`
        )
      );

      await channel.send({
        components: [welcomeContainer],
        flags: MessageFlags.IsComponentsV2
      }).catch(() => {});
    }
    await client.webhooks.server
      .send({
        username: client.user.username,
        avatarURL: client.user.displayAvatarURL(),
        components: [
          new client.embed()
            .desc(`**Joined** ${guild.name} [ ${guild.id} ] [ ${guild.memberCount} ]`)
        ],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => {});
  }
};