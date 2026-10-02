const mongoose = require('mongoose');

const autoreactSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  trigger: { type: String, required: true },
  emojis: [{ type: String }],
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

autoreactSchema.index({ guildId: 1, trigger: 1 }, { unique: true });

module.exports = mongoose.model('Autoreact', autoreactSchema);
