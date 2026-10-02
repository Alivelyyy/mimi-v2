const mongoose = require('mongoose');

const messageStatsSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  totalMessages: { type: Number, default: 0 },
  dailyMessages: { type: Number, default: 0 },
  weeklyMessages: { type: Number, default: 0 },
  lastReset: { type: Date, default: Date.now }
});

messageStatsSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('MessageStats', messageStatsSchema);
