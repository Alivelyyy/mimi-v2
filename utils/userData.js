const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'users_data.json');

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '{}', 'utf8');
      return {};
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[userData] Failed to write users_data.json:', err);
  }
}

function getDefaultUser(userId, username) {
  return {
    userId,
    username: username || 'Unknown',
    totalSongsListened: 0,
    totalCommandsUsed: 0,
    totalListeningTimeMs: 0,
    publicPlaylistsCount: 0,
    lastFiveSongs: [],
    songHistory: {},
    lastActive: Date.now()
  };
}

function getUserData(userId, username) {
  const data = readData();
  if (!data[userId]) {
    data[userId] = getDefaultUser(userId, username);
    writeData(data);
  } else if (username && data[userId].username !== username) {
    data[userId].username = username;
    writeData(data);
  }
  return data[userId];
}

function getAllUsersData() {
  return readData();
}

function addSongToHistory(userId, username, track) {
  const data = readData();
  if (!data[userId]) data[userId] = getDefaultUser(userId, username);

  const user = data[userId];
  user.username = username || user.username;
  user.totalSongsListened = (user.totalSongsListened || 0) + 1;
  user.lastActive = Date.now();

  const songEntry = {
    title: track.title,
    uri: track.uri,
    author: track.author,
    duration: track.length || 0,
    listenedAt: Date.now()
  };

  if (!Array.isArray(user.lastFiveSongs)) user.lastFiveSongs = [];
  user.lastFiveSongs.unshift(songEntry);
  if (user.lastFiveSongs.length > 5) user.lastFiveSongs = user.lastFiveSongs.slice(0, 5);

  if (!user.songHistory) user.songHistory = {};
  const key = `${track.title}|||${track.author}`;
  if (user.songHistory[key]) {
    user.songHistory[key].count += 1;
    user.songHistory[key].lastListened = Date.now();
  } else {
    user.songHistory[key] = {
      title: track.title,
      uri: track.uri,
      author: track.author,
      duration: track.length || 0,
      count: 1,
      lastListened: Date.now()
    };
  }

  data[userId] = user;
  writeData(data);
}

function addListeningTime(userId, username, milliseconds) {
  const data = readData();
  if (!data[userId]) data[userId] = getDefaultUser(userId, username);

  const user = data[userId];
  user.username = username || user.username;
  user.totalListeningTimeMs = (user.totalListeningTimeMs || 0) + milliseconds;
  user.lastActive = Date.now();

  data[userId] = user;
  writeData(data);
}

function incrementCommandCount(userId, username) {
  const data = readData();
  if (!data[userId]) data[userId] = getDefaultUser(userId, username);

  const user = data[userId];
  user.username = username || user.username;
  user.totalCommandsUsed = (user.totalCommandsUsed || 0) + 1;
  user.lastActive = Date.now();

  data[userId] = user;
  writeData(data);
}

function setPublicPlaylistsCount(userId, username, count) {
  const data = readData();
  if (!data[userId]) data[userId] = getDefaultUser(userId, username);

  data[userId].publicPlaylistsCount = count;
  data[userId].username = username || data[userId].username;
  data[userId].lastActive = Date.now();

  writeData(data);
}

function formatListeningTime(ms) {
  if (!ms || ms <= 0) return '0m';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push('<1m');
  return parts.join(' ');
}

module.exports = {
  getUserData,
  getAllUsersData,
  addSongToHistory,
  addListeningTime,
  incrementCommandCount,
  setPublicPlaylistsCount,
  formatListeningTime
};
