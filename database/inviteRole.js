const mongoose = require('mongoose');

const inviteRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  inviteCount: { type: Number, required: true },
  roleId: { type: String, required: true }
});

inviteRoleSchema.index({ guildId: 1, inviteCount: 1 }, { unique: true });

module.exports = mongoose.model('InviteRole', inviteRoleSchema);
