const mongoose = require('mongoose');

const jailSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  roleId: { type: String, default: null },
  channelId: { type: String, default: null },
  logChannelId: { type: String, default: null },
  jailedUsers: [{
    userId: { type: String },
    roles: [{ type: String }],
    jailedAt: { type: Date, default: Date.now },
    reason: { type: String, default: 'No reason' }
  }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Jail', jailSchema);
