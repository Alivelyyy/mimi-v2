const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, default: 'Unknown' },
  commandsUsed: { type: Number, default: 0 },
  songsRequested: { type: Number, default: 0 },
  hoursListened: { type: Number, default: 0 }, // in hours (decimal)
  accountType: { type: String, default: 'FREE', enum: ['FREE', 'PREMIUM', 'VOTER'] },
  premiumUntil: { type: Date, default: null },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userStatsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries (no duplicate userId index since unique: true already creates one)
userStatsSchema.index({ lastActive: -1 });
userStatsSchema.index({ accountType: 1 });

module.exports = mongoose.model('UserStats', userStatsSchema);