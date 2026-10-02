const mongoose = require('mongoose');

const welcomeSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: true },
  channelId: { type: String, required: true },
  message: { type: String, default: 'Welcome {user} to **{server}**! You are member #{count}.' },
  embedColor: { type: String, default: '#5865F2' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Welcome', welcomeSchema);
