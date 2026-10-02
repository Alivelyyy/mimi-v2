global.botGuildsCache = global.botGuildsCache || [];

function addGuild(guildId) {
  try {
    if (!global.botGuildsCache.includes(guildId)) {
      global.botGuildsCache.push(guildId);
    }
    
    if (global.voiceStateCache && global.voiceStateCache[guildId]) {
      delete global.voiceStateCache[guildId];
    }
  } catch (error) {
    console.error('Error adding guild to cache:', error.message);
  }
}

function removeGuild(guildId) {
  try {
    const index = global.botGuildsCache.indexOf(guildId);
    if (index > -1) {
      global.botGuildsCache.splice(index, 1);
    }
    
    if (global.voiceStateCache && global.voiceStateCache[guildId]) {
      delete global.voiceStateCache[guildId];
    }
  } catch (error) {
    console.error('Error removing guild from cache:', error.message);
  }
}

module.exports = {
  addGuild,
  removeGuild
};
