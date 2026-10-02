const mongoose = require('mongoose');

const automodSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  punishment: { type: String, default: 'mute', enum: ['mute', 'kick', 'ban', 'warn'] },
  logChannelId: { type: String, default: null },
  antiLinks: { type: Boolean, default: false },
  antiInvites: { type: Boolean, default: false },
  antiSpam: { type: Boolean, default: false },
  antiMassMention: { type: Boolean, default: false },
  massMentionLimit: { type: Number, default: 5 },
  antiCaps: { type: Boolean, default: false },
  capsLimit: { type: Number, default: 70 },
  ignoredChannels: [{ type: String }],
  ignoredRoles: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Automod', automodSchema);
