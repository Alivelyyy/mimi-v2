const mongoose = require('mongoose');

const vcBanSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, default: 'No reason provided' },
  bannedAt: { type: Date, default: Date.now }
});

vcBanSchema.index({ guildId: 1, channelId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('VcBan', vcBanSchema);
