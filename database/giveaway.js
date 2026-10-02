const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  hostId: { type: String, required: true },
  prize: { type: String, required: true },
  winners: { type: Number, default: 1 },
  entries: [{ type: String }],
  endsAt: { type: Date, required: true },
  ended: { type: Boolean, default: false },
  winnerIds: [{ type: String }],
  staffRoleId: { type: String, default: null },
  embedColor: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Giveaway', giveawaySchema);
