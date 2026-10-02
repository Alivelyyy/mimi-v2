const mongoose = require('mongoose');

const modActionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  caseId: { type: Number, required: true },
  action: { type: String, required: true, enum: ['ban', 'kick', 'timeout', 'untimeout', 'warn', 'softban', 'unban', 'jail', 'unjail', 'lock', 'unlock', 'hide', 'unhide', 'purge', 'slowmode', 'nuke', 'massban'] },
  targetId: { type: String, default: null },
  targetTag: { type: String, default: null },
  moderatorId: { type: String, required: true },
  moderatorTag: { type: String, required: true },
  reason: { type: String, default: 'No reason provided' },
  duration: { type: String, default: null },
  extra: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
});

modActionSchema.index({ guildId: 1, caseId: -1 }, { unique: true });
modActionSchema.index({ guildId: 1, targetId: 1 });
modActionSchema.index({ guildId: 1, moderatorId: 1 });

module.exports = mongoose.model('ModAction', modActionSchema);
