const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: "serverinfo",
  aliases: ['si', 'guildinfo'],
  cooldown: "5",
  category: "utility",
  description: "Shows information about the server",
  args: false,
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
    const guild = message.guild;
    const { createdTimestamp, ownerId } = guild;

    const roles = guild.roles.cache
      .sort((a, b) => b.position - a.position)
      .filter(r => r.id !== guild.id)
      .map(role => `\`${role.name}\``);

    let rolesdisplay;
    if (roles.length < 1) {
      rolesdisplay = 'None';
    } else if (roles.length < 15) {
      rolesdisplay = roles.join(', ');
    } else {
      rolesdisplay = roles.slice(0, 14).join(', ') + ` \`+${roles.length - 14} more\``;
    }

    const channels = guild.channels.cache;
    const emojis = guild.emojis.cache;
    let bans = 0;
    try {
      bans = await guild.bans.fetch().then(x => x.size);
    } catch {}

    const verificationLevels = {
      0: 'None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
      4: 'Very High'
    };

    const boostTiers = {
      0: 'Level 0',
      1: 'Level 1',
      2: 'Level 2',
      3: 'Level 3'
    };

    let ownerName = ownerId;
    try {
      const ownerMember = await guild.members.fetch(ownerId).catch(() => null);
      ownerName = ownerMember ? ownerMember.user.username : ownerId;
    } catch {}

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${guild.name}`)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    if (guild.iconURL({ dynamic: true })) {
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(guild.iconURL({ dynamic: true }))
        )
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
    }

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**About**\n` +
        `**Name:** ${guild.name}\n` +
        `**ID:** \`${guild.id}\`\n` +
        `**Owner:** ${ownerName} (\`${ownerId}\`)\n` +
        `**Created:** <t:${parseInt(createdTimestamp / 1000)}:R>\n` +
        `**Members:** ${guild.memberCount}\n` +
        `**Banned Members:** ${bans}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Server Information**\n` +
        `**Verification Level:** ${verificationLevels[guild.verificationLevel] ?? guild.verificationLevel}\n` +
        `**AFK Channel:** ${guild.afkChannelId ? `<#${guild.afkChannelId}>` : 'None'}\n` +
        `**AFK Timeout:** ${guild.afkTimeout / 60} mins\n` +
        `**System Channel:** ${guild.systemChannelId ? `<#${guild.systemChannelId}>` : 'None'}\n` +
        `**Boost Progress Bar:** ${guild.premiumProgressBarEnabled ? 'Enabled' : 'Disabled'}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Channels**\n` +
        `**Total:** ${channels.size}\n` +
        `**Text:** ${channels.filter(c => c.type === 0).size}  |  **Voice:** ${channels.filter(c => c.type === 2).size}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Emojis**\n` +
        `**Regular:** ${emojis.filter(e => !e.animated).size}  |  **Animated:** ${emojis.filter(e => e.animated).size}  |  **Total:** ${emojis.size}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Boost Status**\n` +
        `${boostTiers[guild.premiumTier] ?? `Level ${guild.premiumTier}`} — **${guild.premiumSubscriptionCount || 0}** boosts`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Roles [${roles.length}]**\n${rolesdisplay}`
      )
    );

    if (guild.bannerURL()) {
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(guild.bannerURL({ size: 4096 }))
        )
      );
    }

    message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => {});
  }
};
