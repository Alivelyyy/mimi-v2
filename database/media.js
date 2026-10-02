const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  mediaOnly: { type: Boolean, default: true },
  bypassUsers: [{ type: String }],
  bypassRoles: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Media', mediaSchema);
