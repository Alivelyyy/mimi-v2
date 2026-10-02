
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags
} = require('discord.js');
const blackEmoji = require('@assets/emojis/black.js');

// Discord Badge Emojis
const DISCORD_EMPLOYEE = `<:DiscordStaff:1354485362847781109>`;
const DISCORD_PARTNER = `<:discord_partner:1354485631434359006>`;
const BUGHUNTER_LEVEL_1 = `<:MekoBigHunterLevel1:1354485851966542028>`;
const BUGHUNTER_LEVEL_2 = `<:bughunter_level_2:1354485874045485178>`;
const HYPESQUAD_EVENTS = `<:MekoHypesquadEvents:1354486593557237840>`;
const HOUSE_BRAVERY = `<:HOUSE_BRAVERY:1354486636809031861>`;
const HOUSE_BRILLIANCE = `<:MekoHypeSquadBrilliance:1354486733424689152>`;
const HOUSE_BALANCE = `<:House_Balance:1354486801787523142>`;
const EARLY_SUPPORTER = `<:MekoEarlySupporter:1354486936026218527>`;
const TEAM_USER = `<:TeamUser:1354487008205996244>`;
const SYSTEM = `<a:System:1354487084714426549>`;
const VERIFIED_BOT = `<:MekoBot:1354487172115464375>`;
const VERIFIED_DEVELOPER = `<:VerifiedDeveloper:1354487266176798760>`;
const ACTIVE_DEVELOPER = `<:active_developer:1354487409999613973>`;

module.exports = {
  name: "userinfo",
  aliases: ['ui', 'whois'],
  cooldown: "5",
  category: "utility",
  description: "Shows information about a user",
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
    const targetId = message.mentions.users.first()?.id || args[0] || message.author.id;
    const user = await client.users.fetch(targetId, { force: true }).catch(() => null);

    if (!user) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.no} User not found`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const member = message.guild.members.cache.get(user.id);
    const uid = `ui_${message.id}`;

    // Get user badges
    const userFlags = user.flags?.toArray() || [];
    let badges = [];
    
    if (userFlags.includes('Staff')) badges.push(DISCORD_EMPLOYEE);
    if (userFlags.includes('Partner')) badges.push(DISCORD_PARTNER);
    if (userFlags.includes('BugHunterLevel1')) badges.push(BUGHUNTER_LEVEL_1);
    if (userFlags.includes('BugHunterLevel2')) badges.push(BUGHUNTER_LEVEL_2);
    if (userFlags.includes('HypeSquadEvents')) badges.push(HYPESQUAD_EVENTS);
    if (userFlags.includes('HouseBravery')) badges.push(HOUSE_BRAVERY);
    if (userFlags.includes('HouseBrilliance')) badges.push(HOUSE_BRILLIANCE);
    if (userFlags.includes('HouseBalance')) badges.push(HOUSE_BALANCE);
    if (userFlags.includes('EarlySupporter')) badges.push(EARLY_SUPPORTER);
    if (userFlags.includes('TeamUser')) badges.push(TEAM_USER);
    if (userFlags.includes('System')) badges.push(SYSTEM);
    if (userFlags.includes('VerifiedBot')) badges.push(VERIFIED_BOT);
    if (userFlags.includes('VerifiedDeveloper')) badges.push(VERIFIED_DEVELOPER);
    if (userFlags.includes('ActiveDeveloper')) badges.push(ACTIVE_DEVELOPER);

    // Generate main container
    const mainContainer = () => {
      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.user} ${user.tag}'s Information`)
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

      if (user.displayAvatarURL({ dynamic: true, size: 4096 })) {
        container.addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(user.displayAvatarURL({ dynamic: true, size: 4096 }))
          )
        );

        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );
      }

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**General Information**\n` +
          `**Name**: ${user.username}\n` +
          `**Display Name**: ${user.displayName}\n` +
          `**ID**: ${user.id}\n` +
          `**Account Created**: <t:${Math.floor(user.createdTimestamp / 1000)}:R>\n` +
          `**Badges**: ${badges.length ? badges.join(' ') : 'None'}`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Server Information**\n` +
          (member ? `**Nickname**: ${member.nickname}\n**Joined Server**: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n**Highest Role**: ${member.roles.highest.name}` : 'Not a member of this server')
        )
      );

      if (user.bannerURL({ dynamic: true, size: 4096 })) {
        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );

        container.addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(user.bannerURL({ dynamic: true, size: 4096 }))
          )
        );
      }

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Requested by ${message.author.tag}*`)
      );

      container.addActionRowComponents(row);

      return container;
    };

    // Generate roles container
    const rolesContainer = () => {
      if (!member) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent('User is not a member of this server')
        );
        return container;
      }
      const roles = member.roles.cache
        .sort((a, b) => b.position - a.position)
        .map(r => r)
        .filter(r => r.id !== message.guild.id);

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.user} ${user.tag}'s Roles`)
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(roles.length ? trimArray(roles) : 'No roles')
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Total Roles: ${roles.length} | Requested by ${message.author.tag}*`)
      );

      container.addActionRowComponents(row);

      return container;
    };

    // Generate permissions container
    const permissionsContainer = () => {
      if (!member) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent('User is not a member of this server')
        );
        return container;
      }
      const perms = member.permissions.toArray()
        .map(p => `\`${p.toLowerCase().replace(/_/g, ' ')}\``)
        .sort();

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.user} ${user.tag}'s Permissions`)
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(perms.join(', '))
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Total Permissions: ${perms.length} | Requested by ${message.author.tag}*`)
      );

      container.addActionRowComponents(row);

      return container;
    };

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`${uid}_main`)
          .setLabel('General')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`${uid}_roles`)
          .setLabel('Roles')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!member),
        new ButtonBuilder()
          .setCustomId(`${uid}_perms`)
          .setLabel('Permissions')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!member),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Avatar')
          .setURL(user.displayAvatarURL({ dynamic: true, size: 4096 }))
      );

    if (user.bannerURL()) {
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Banner')
          .setURL(user.bannerURL({ dynamic: true, size: 4096 }))
      );
    }

    // Send initial message
    const msg = await message.reply({
      components: [mainContainer()],
      flags: MessageFlags.IsComponentsV2,
    });

    // Create collector
    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      const containerMap = {
        [`${uid}_main`]: mainContainer,
        [`${uid}_roles`]: rolesContainer,
        [`${uid}_perms`]: permissionsContainer
      };

      const builder = containerMap[interaction.customId];
      if (!builder) return;
      const container = builder();
      await msg.edit({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    });

    collector.on('end', () => {
      // Since buttons are integrated, create a disabled container
      const disabledContainer = new ContainerBuilder();
      disabledContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.user} ${user.tag}'s Information\n\n*Interaction timed out*`)
      );
      msg.edit({
        components: [disabledContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => {});
    });
  }
};

function trimArray(arr, maxLen = 25) {
  if (arr.length > maxLen) {
    const len = arr.length - maxLen;
    const shown = arr
      .slice(0, maxLen)
      .map(role => `\`${role.name}\``);
    shown.push(`\`+${len} more\``);
    return shown.join(", ");
  }
  return arr.map(role => `\`${role.name}\``).join(", ");
}
