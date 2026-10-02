const mongoose = require('mongoose');

const antibotSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  whitelist: [{ type: String }],
  action: { type: String, default: 'kick', enum: ['kick', 'ban'] },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Antibot', antibotSchema);
