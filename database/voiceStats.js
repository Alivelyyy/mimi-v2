const mongoose = require('mongoose');

const voiceStatsSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  totalTime: { type: Number, default: 0 },
  dailyTime: { type: Number, default: 0 },
  weeklyTime: { type: Number, default: 0 },
  lastJoined: { type: Date, default: null },
  lastReset: { type: Date, default: Date.now }
});

voiceStatsSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('VoiceStats', voiceStatsSchema);
