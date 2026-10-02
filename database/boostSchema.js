const mongoose = require('mongoose');

const boostSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: true },
  channelId: { type: String, required: true },
  message: { type: String, default: '{user} just **boosted** the server! {server} now has **{boostcount}** boosts!' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Boost', boostSchema);
