const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require("discord.js");
const blackEmoji = require('@assets/emojis/black.js');
const { getUserData, getAllUsersData, formatListeningTime } = require('@utils/userData');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function buildArtistProfile(userData) {
  const profile = {};
  const now = Date.now();
  for (const song of Object.values(userData.songHistory || {})) {
    const artist = (song.author).toLowerCase().trim();
    if (!artist) continue;
    const ageMs = now - (song.lastListened || 0);
    const recency = ageMs < 7 * 86400000 ? 3 : ageMs < 30 * 86400000 ? 2 : 1;
    profile[artist] = (profile[artist] || 0) + (song.count || 1) * recency;
  }
  return profile;
}

function artistOverlap(profileA, profileB) {
  const setA = new Set(Object.keys(profileA));
  const setB = new Set(Object.keys(profileB));
  const intersection = [...setA].filter(a => setB.has(a)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function capitalize(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─────────────────────────────────────────────────────────────
// RECOMMENDATION ENGINE
// ─────────────────────────────────────────────────────────────

function buildRecommendations(targetUserId, limit = 8) {
  const allData = getAllUsersData();
  const userData = allData[targetUserId];

  if (!userData || !userData.songHistory) {
    return { recommendations: [], profile: {}, similarUsers: [], topArtists: [], mode: 'empty' };
  }

  const songHistory = userData.songHistory;
  const userProfile = buildArtistProfile(userData);
  const now = Date.now();

  const topArtists = Object.entries(userProfile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([a]) => a);

  if (topArtists.length === 0) {
    return { recommendations: [], profile: userProfile, similarUsers: [], topArtists: [], mode: 'empty' };
  }

  const heardKeys = new Set(Object.keys(songHistory));
  const candidates = new Map(); // key → candidate object

  // ── LAYER 1: Cross-user collaborative filtering ──────────────
  const otherUsers = Object.entries(allData).filter(([uid]) => uid !== targetUserId);
  const similarUsers = [];

  for (const [uid, otherData] of otherUsers) {
    if (!otherData?.songHistory) continue;
    const otherProfile = buildArtistProfile(otherData);
    const sim = artistOverlap(userProfile, otherProfile);
    if (sim >= 0.1) similarUsers.push({ uid, sim, songHistory: otherData.songHistory });
  }
  similarUsers.sort((a, b) => b.sim - a.sim);

  for (const simUser of similarUsers.slice(0, 30)) {
    for (const [key, song] of Object.entries(simUser.songHistory)) {
      if (heardKeys.has(key) || !song.uri) continue;
      const artist = (song.author).toLowerCase().trim();
      const artistAffinity = userProfile[artist] || 0;
      if (!candidates.has(key)) {
        candidates.set(key, { ...song, cfScore: 0, globalCount: 0, artistAffinity, reasons: [], layer: 1 });
      }
      const c = candidates.get(key);
      c.cfScore += simUser.sim * (song.count || 1);
      c.globalCount += song.count || 1;
      if (topArtists.includes(artist) && !c.reasons.includes('artist')) c.reasons.push('artist');
      if (!c.reasons.includes('cf')) c.reasons.push('cf');
    }
  }

  // Also pull songs from any user matching top artists even with no overlap
  for (const [uid, otherData] of otherUsers) {
    if (!otherData?.songHistory) continue;
    for (const [key, song] of Object.entries(otherData.songHistory)) {
      if (heardKeys.has(key) || !song.uri) continue;
      const artist = (song.author).toLowerCase().trim();
      if (!topArtists.includes(artist)) continue;
      if (!candidates.has(key)) {
        candidates.set(key, { ...song, cfScore: 0, globalCount: 0, artistAffinity: userProfile[artist] || 0, reasons: ['artist'], layer: 1 });
      }
      const c = candidates.get(key);
      c.globalCount += song.count || 1;
      if (!c.reasons.includes('artist')) c.reasons.push('artist');
    }
  }

  // ── LAYER 2: Rediscovery (from own history, not heard in >7 days) ──
  // Songs the user loved before that deserve another spin
  const rediscovery = [];
  for (const [key, song] of Object.entries(songHistory)) {
    if (!song.uri) continue;
    const daysSince = (now - (song.lastListened || 0)) / 86400000;
    if (daysSince < 7) continue; // heard recently, skip
    // Score: higher count + older = better rediscovery
    const rediscoveryScore = (song.count || 1) * Math.min(daysSince / 7, 5);
    rediscovery.push({ ...song, rediscoveryScore, reasons: ['rediscovery'], layer: 2 });
  }
  rediscovery.sort((a, b) => b.rediscoveryScore - a.rediscoveryScore);

  // ── LAYER 3: Hidden gems (heard only once, worth exploring again) ──
  const hiddenGems = [];
  for (const [key, song] of Object.entries(songHistory)) {
    if (!song.uri) continue;
    if ((song.count || 0) !== 1) continue; // exactly once
    const artist = (song.author).toLowerCase().trim();
    const affinity = userProfile[artist] || 0;
    // Gems from loved artists get priority
    hiddenGems.push({ ...song, affinity, reasons: ['gem'], layer: 3 });
  }
  hiddenGems.sort((a, b) => b.affinity - a.affinity);

  // ── Scoring function for cross-user candidates ──
  function scoreCrossUser(c) {
    return (c.artistAffinity * 2) + (c.cfScore * 3) + (c.globalCount * 1.5);
  }

  // ── Diversity cap: max 2 per artist ──
  function pickWithDiversity(pool, target, getArtist) {
    const artistCount = {};
    const picked = [];
    for (const item of pool) {
      if (picked.length >= target) break;
      const artist = getArtist(item);
      const n = artistCount[artist] || 0;
      if (n >= 2) continue;
      artistCount[artist] = n + 1;
      picked.push(item);
    }
    return picked;
  }

  // ── Assemble final list ──
  // Priority: cross-user new songs first, then fill with rediscoveries, then gems
  const crossUserSorted = [...candidates.values()]
    .sort((a, b) => scoreCrossUser(b) - scoreCrossUser(a));

  const crossUserPicked = pickWithDiversity(
    crossUserSorted, limit, s => (s.author).toLowerCase().trim()
  );

  let recommendations = [...crossUserPicked];
  let mode = crossUserPicked.length > 0 ? 'mixed' : 'own';

  // Fill remaining with rediscovery picks (marked as layer 2)
  if (recommendations.length < limit) {
    const need = limit - recommendations.length;
    const usedKeys = new Set(recommendations.map(r => `${r.title}|||${r.author}`));
    const eligibleRediscovery = rediscovery.filter(s => {
      const k = `${s.title}|||${s.author}`;
      return !usedKeys.has(k);
    });
    const redPicked = pickWithDiversity(
      eligibleRediscovery, need, s => (s.author).toLowerCase().trim()
    );
    recommendations.push(...redPicked);
    redPicked.forEach(r => usedKeys.add(`${r.title}|||${r.author}`));
  }

  // Fill remaining with hidden gems
  if (recommendations.length < limit) {
    const need = limit - recommendations.length;
    const usedKeys = new Set(recommendations.map(r => `${r.title}|||${r.author}`));
    const eligibleGems = hiddenGems.filter(s => {
      const k = `${s.title}|||${s.author}`;
      return !usedKeys.has(k);
    });
    const gemPicked = pickWithDiversity(
      eligibleGems, need, s => (s.author).toLowerCase().trim()
    );
    recommendations.push(...gemPicked);
  }

  if (mode === 'own' && recommendations.length === 0) mode = 'empty';

  return { recommendations, profile: userProfile, similarUsers, topArtists, mode };
}

// ─────────────────────────────────────────────────────────────
// REASON LABELS
// ─────────────────────────────────────────────────────────────

function getReasonLabel(song, topArtists) {
  const reasons = song.reasons || [];
  const artist = (song.author).toLowerCase().trim();

  if (reasons.includes('rediscovery')) {
    const days = Math.round((Date.now() - (song.lastListened || 0)) / 86400000);
    return `${blackEmoji.loop} Haven't played this in **${days}d** — worth another spin`;
  }
  if (reasons.includes('gem')) {
    return `${blackEmoji.gem} You only heard this once — give it another chance`;
  }
  if (reasons.includes('artist') && topArtists.includes(artist)) {
    return `${blackEmoji.target} Based on your love of **${capitalize(artist)}**`;
  }
  if (reasons.includes('cf')) {
    return `${blackEmoji.users} Loved by listeners with similar taste`;
  }
  return `${blackEmoji.sparkle} Picked for your taste`;
}

// ─────────────────────────────────────────────────────────────
// BUILD DISPLAY CONTAINER
// ─────────────────────────────────────────────────────────────

function buildResultContainer(user, recommendations, profile, similarUsers, topArtists, userData, client, mode, label) {
  const container = new ContainerBuilder();
  const simCount = similarUsers.filter(u => u.sim >= 0.2).length;
  const topArtistDisplay = topArtists.slice(0, 3).map(capitalize).join(', ');

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `# ${blackEmoji.music} For You${label ? ` *(${label})*` : ''} — ${user.username}`
    )
  );
  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );

  // Mode badge
  const modeBadge = mode === 'mixed'
    ? `${blackEmoji.user} Cross-user + personal picks`
    : `${blackEmoji.track} Personalised from your history`;

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### ${blackEmoji.stats} Taste Snapshot\n` +
      `> ${blackEmoji.track} **Top Artists:** ${topArtistDisplay}\n` +
      `> ${blackEmoji.time} **Time Listened:** \`${formatListeningTime(userData.totalListeningTimeMs || 0)}\`\n` +
      `> ${blackEmoji.user} **Similar Listeners:** \`${simCount}\`\n` +
      `> ${blackEmoji.info} ${modeBadge}`
    )
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`### ${blackEmoji.trophy} Your Picks`)
  );

  const recLines = recommendations.map((song, i) => {
    const num = i === 0 ? blackEmoji.target : `**${i + 1}.**`;
    const title = song.uri
      ? `[${song.title.substring(0, 50)}](${song.uri})`
      : song.title.substring(0, 50);
    const reason = getReasonLabel(song, topArtists);
    return `> ${num} ${title}\n> ${blackEmoji.user} ${song.author}\n> ${reason}`;
  }).join('\n');

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(recLines)
  );

  container.addSeparatorComponents(
    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `${blackEmoji.point} Click a title to open it • \`${client.prefix}play <title>\` to queue`
    )
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rec_refresh').setLabel('Refresh Picks').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('rec_profile').setLabel('Taste Profile').setStyle(ButtonStyle.Secondary)
    )
  );

  return container;
}

// ─────────────────────────────────────────────────────────────
// COMMAND
// ─────────────────────────────────────────────────────────────

module.exports = {
  name: "recommend",
  aliases: ['rec', 'suggestions'],
  cooldown: "10",
  category: "music",
  usage: "[user]",
  description: "Get personalised song recommendations based on your listening history",
  args: false,
  vote: false,
  new: true,
  admin: false,
  owner: false,
  botPerms: [],
  userPerms: [],
  player: false,
  queue: false,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (client, message, args, emoji) => {
    const targetId = message.mentions.users.first()?.id || args[0] || message.author.id;
    const user = await client.users.fetch(targetId).catch(() => null);

    if (!user) {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${blackEmoji.cross} Invalid user provided`));
      return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    // Loading state
    const loadingContainer = new ContainerBuilder();
    loadingContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# ${blackEmoji.loading} Analysing Listening Data\n` +
        `> Building recommendations for **${user.username}**…`
      )
    );
    const loadingMsg = await message.reply({ components: [loadingContainer], flags: MessageFlags.IsComponentsV2 });

    let result;
    try {
      result = buildRecommendations(targetId, 8);
    } catch (err) {
      console.error('[recommend] Engine error:', err);
      result = { recommendations: [], profile: {}, similarUsers: [], topArtists: [], mode: 'empty' };
    }

    const { recommendations, profile, similarUsers, topArtists, mode } = result;
    const userData = getUserData(user.id, user.username);

    if (mode === 'empty' || recommendations.length === 0) {
      const uniqueSongs = Object.keys(userData.songHistory || {}).length;
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`# ${blackEmoji.music} For You — ${user.username}`)
      );
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${blackEmoji.info} No History Found\n` +
          `> ${blackEmoji.arrow} Start listening to music with the bot to get personalised picks.\n` +
          `> ${blackEmoji.music} **Songs tracked:** \`${uniqueSongs}\`\n\n` +
          `${blackEmoji.point} Play some songs then run \`${client.prefix}recommend\` again!`
        )
      );
      return await loadingMsg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 });
    }

    const simCount = similarUsers.filter(u => u.sim >= 0.2).length;

    const mainContainer = buildResultContainer(
      user, recommendations, profile, similarUsers, topArtists, userData, client, mode, null
    );

    const response = await loadingMsg.edit({ components: [mainContainer], flags: MessageFlags.IsComponentsV2 });

    const collector = response.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 120000,
      idle: 60000
    });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();

      if (interaction.customId === 'rec_refresh') {
        const reloading = new ContainerBuilder();
        reloading.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `# ${blackEmoji.loading} Re-analysing…\n> Refreshing picks for **${user.username}**`
          )
        );
        await response.edit({ components: [reloading], flags: MessageFlags.IsComponentsV2 });

        let newResult;
        try {
          newResult = buildRecommendations(targetId, 8);
        } catch {
          newResult = { recommendations: [], profile: {}, similarUsers: [], topArtists: [], mode: 'empty' };
        }

        if (!newResult.recommendations.length) {
          const c = new ContainerBuilder();
          c.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `# ${blackEmoji.music} For You — ${user.username}\n> ${blackEmoji.info} No picks available yet — listen to more songs!`
            )
          );
          return await response.edit({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        const refreshed = buildResultContainer(
          user,
          newResult.recommendations,
          newResult.profile,
          newResult.similarUsers,
          newResult.topArtists,
          userData,
          client,
          newResult.mode,
          'refreshed'
        );
        await response.edit({ components: [refreshed], flags: MessageFlags.IsComponentsV2 });
      }

      if (interaction.customId === 'rec_profile') {
        const uniqueSongs = Object.keys(userData.songHistory || {}).length;
        const topSongsText = Object.values(userData.songHistory || {})
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((s, i) => {
            const title = s.uri ? `[${s.title.substring(0, 38)}](${s.uri})` : s.title.substring(0, 38);
            return `> **${i + 1}.** ${title}\n> ${blackEmoji.user} ${s.author} • played **${s.count}x**`;
          })
          .join('\n') || `> ${blackEmoji.cross} No songs yet`;

        const topArtistsText = topArtists.slice(0, 5).map((a, i) => {
          const score = Math.round(profile[a] || 0);
          return `> **${i + 1}.** ${capitalize(a)} — affinity \`${score}\``;
        }).join('\n') || `> ${blackEmoji.cross} No artists yet`;

        const statsContainer = new ContainerBuilder();
        statsContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`# ${blackEmoji.stats} ${user.username}'s Taste Profile`)
        );
        statsContainer.addSeparatorComponents(
          new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
        );
        statsContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${blackEmoji.music} Overview\n` +
            `> ${blackEmoji.music} **Total Plays:** \`${(userData.totalSongsListened || 0).toLocaleString()}\`\n` +
            `> ${blackEmoji.track} **Unique Songs:** \`${uniqueSongs.toLocaleString()}\`\n` +
            `> ${blackEmoji.time} **Time Listened:** \`${formatListeningTime(userData.totalListeningTimeMs || 0)}\`\n` +
            `> ${blackEmoji.user} **Similar Listeners:** \`${simCount}\``
          )
        );
        statsContainer.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );
        statsContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### ${blackEmoji.trophy} Top 5 Songs\n${topSongsText}`)
        );
        statsContainer.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        );
        statsContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### ${blackEmoji.track} Top Artists\n${topArtistsText}`)
        );
        statsContainer.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rec_back').setLabel('Back to Picks').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('rec_refresh').setLabel('Refresh Picks').setStyle(ButtonStyle.Primary)
          )
        );
        await response.edit({ components: [statsContainer], flags: MessageFlags.IsComponentsV2 });
      }

      if (interaction.customId === 'rec_back') {
        await response.edit({ components: [mainContainer], flags: MessageFlags.IsComponentsV2 });
      }
    });

    collector.on('end', () => {
      const final = new ContainerBuilder();
      final.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# ${blackEmoji.music} For You — ${user.username}\n*Timed out — run \`${client.prefix}recommend\` for fresh picks*`
        )
      );
      response.edit({ components: [final], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
  }
};