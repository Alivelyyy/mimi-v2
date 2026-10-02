const mongoose = require('mongoose');

const customCmdSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  response: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

customCmdSchema.index({ guildId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CustomCmd', customCmdSchema);
