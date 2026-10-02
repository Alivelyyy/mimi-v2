const mongoose = require('mongoose');

const extraownerSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  owners: [{ type: String }],
  ignoredCommands: [{ commandName: String, type: { type: String, enum: ['channel', 'user', 'role'] }, id: String }],
  ignoredChannels: [{ type: String }],
  ignoredUsers: [{ type: String }],
  ignoredRoles: [{ type: String }],
  bypassUsers: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExtraOwner', extraownerSchema);
