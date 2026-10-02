const mongoose = require('mongoose');

const lbBlacklistSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  type: { type: String, enum: ['channel', 'category'], required: true },
  targetId: { type: String, required: true }
});

lbBlacklistSchema.index({ guildId: 1, type: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('LbBlacklist', lbBlacklistSchema);
