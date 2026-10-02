const mongoose = require('mongoose');

const lbSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  voiceLb: { type: Boolean, default: false },
  messageLb: { type: Boolean, default: false },
  inviteLb: { type: Boolean, default: false },
  altThreshold: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LbSettings', lbSettingsSchema);
