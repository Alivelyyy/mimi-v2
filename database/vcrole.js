const mongoose = require('mongoose');

const vcroleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  voiceChannelId: { type: String, required: true },
  roleId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

vcroleSchema.index({ guildId: 1, voiceChannelId: 1 }, { unique: true });

module.exports = mongoose.model('VCRole', vcroleSchema);
