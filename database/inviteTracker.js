const mongoose = require('mongoose');

const inviteTrackerSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  totalInvites: { type: Number, default: 0 },
  regularInvites: { type: Number, default: 0 },
  fakeInvites: { type: Number, default: 0 },
  leftInvites: { type: Number, default: 0 },
  invitedUsers: [{ type: String }],
  invitedBy: { type: String, default: null }
});

inviteTrackerSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('InviteTracker', inviteTrackerSchema);
