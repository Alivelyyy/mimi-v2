const mongoose = require('mongoose');

const messageRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  messageCount: { type: Number, required: true },
  roleId: { type: String, required: true }
});

messageRoleSchema.index({ guildId: 1, messageCount: 1 }, { unique: true });

module.exports = mongoose.model('MessageRole', messageRoleSchema);
