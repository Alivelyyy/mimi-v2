const mongoose = require('mongoose');

const autoroleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  humanRoles: [{ type: String }],
  botRoles: [{ type: String }],
  enabled: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Autorole', autoroleSchema);
