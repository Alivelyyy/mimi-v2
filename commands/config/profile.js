const { 
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');
const { getUserData, formatListeningTime } = require('@utils/userData');

module.exports = {
  name: "profile",
  aliases: ['prof', 'myprofile'],
  cooldown: "5",
  category: "config",
  usage: "[user]",
  description: "View user profile and badges",
  args: false,
  vote: false,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  profile: true,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const targetId = message.mentions.users.first()?.id || args[0] || message.author.id;
    const user = await client.users.fetch(targetId).catch(() => null);

    if (!user) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${blackEmoji.cross} Invalid user provided`)
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const [premiumUser, dev, admin, badges] = await Promise.all([
      client.db.premium.get(`${client.user.id}_${user.id}`),
      client.owners.find(x => x === user.id),
      client.admins.find(x => x === user.id),
      client.db.badges.get(`${client.user.id}_${user.id}`) || []
    ]);

    const userData = getUserData(user.id, user.username);
    const uniqueSongs = Object.keys(userData.songHistory || {}).length;

    const premiumStatus = premiumUser === true 
      ? `${blackEmoji.diamond} Lifetime Premium` 
      : premiumUser 
        ? `${blackEmoji.time} Expires <t:${Math.floor(premiumUser/1000)}:R>`
        : `${blackEmoji.cross} Not Active`;

    const member = message.guild.members.cache.get(user.id);
    const highestRole = member?.roles.highest;

    let serverBadges = [];
    if (message.guild.ownerId === user.id) {
      serverBadges.push(`> ${blackEmoji.crown} Server Owner`);
    } else if (highestRole) {
      if (highestRole.permissions.has("Administrator")) 
        serverBadges.push(`> ${blackEmoji.admin} Administrator`);
      if (highestRole.permissions.has("ManageGuild")) 
        serverBadges.push(`> ${blackEmoji.manager} Server Manager`);
      if (highestRole.permissions.has("ModerateMembers")) 
        serverBadges.push(`> ${blackEmoji.mod} Moderator`);
    }
    if (serverBadges.length === 0) serverBadges.push(`> ${blackEmoji.user} Server Member`);

    let botBadges = [];
    if (dev) botBadges.push(`> ${blackEmoji.crown} Bot Owner`);
    if (admin) botBadges.push(`> ${blackEmoji.admin} Bot Admin`);
    if (premiumUser) botBadges.push(`> ${blackEmoji.diamond} Premium User`);
    if (botBadges.length === 0) botBadges.push(`> ${blackEmoji.user} Regular User`);

    const badgeEmojis = {
      dev: `> ${blackEmoji.dev} Developer`,
      staff: `> ${blackEmoji.team} Staff Team`,
      vip: `> ${blackEmoji.vip} VIP Member`,
      friend: `> ${blackEmoji.friend} Friend`,
      partner: `> ${blackEmoji.partner} Partner`,
      contributor: `> ${blackEmoji.contributor} Contributor`,
      earlysupporter: `> ${blackEmoji.earlysupporter} Early Supporter`,
      beta: `> ${blackEmoji.beta} Beta Tester`
    };

    let customBadges = (badges || []).map(badge => badgeEmojis[badge] || "").filter(Boolean);
    if (customBadges.length === 0) customBadges.push(`> ${blackEmoji.user} No Special Badges`);

    const container = new ContainerBuilder();
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ${blackEmoji.user} ${user.username}'s Profile`)
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.crown} Bot Status\n` +
        botBadges.join('\n')
      )
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.server} Server Status\n` +
        serverBadges.join('\n')
      )
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.trophy} Special Badges\n` +
        customBadges.join('\n')
      )
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.stats} Statistics\n` +
        `> ${blackEmoji.diamond} **Premium:** ${premiumStatus}\n` +
        `> ${blackEmoji.time} **Member Since:** <t:${Math.floor(member?.joinedTimestamp/1000 || Date.now()/1000)}:R>`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
    );

    const lastSong = userData.lastFiveSongs?.[0];
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${blackEmoji.music} Music Stats\n` +
        `> ${blackEmoji.music} **Songs Listened:** \`${(userData.totalSongsListened || 0).toLocaleString()}\`\n` +
        `> ${blackEmoji.time} **Time Listened:** \`${formatListeningTime(userData.totalListeningTimeMs || 0)}\`\n` +
        `> ${blackEmoji.track} **Unique Songs:** \`${uniqueSongs.toLocaleString()}\`\n` +
        `> ${blackEmoji.data} **Commands Used:** \`${(userData.totalCommandsUsed || 0).toLocaleString()}\`\n` +
        `> ${blackEmoji.playlist} **Public Playlists:** \`${(userData.publicPlaylistsCount || 0).toLocaleString()}\`\n` +
        (lastSong ? `> ${blackEmoji.track} **Last Played:** [${lastSong.title.substring(0, 40)}](${lastSong.uri}) <t:${Math.floor(lastSong.listenedAt / 1000)}:R>` : `> ${blackEmoji.track} **Last Played:** \`Nothing yet\``)
      )
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );

    const voteUrl = `https://top.gg/bot/${client.user.id}/vote`;
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Vote for Rewards")
        .setStyle(ButtonStyle.Link)
        .setURL(voteUrl),
      new ButtonBuilder()
        .setLabel("Get Premium")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/XSUZQZn3yB")
    );
    container.addActionRowComponents(row);

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
};
