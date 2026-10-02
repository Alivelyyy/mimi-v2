const mongoose = require('mongoose');

const roleEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  roleId: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const customSetupSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  managerRole: { type: String, default: null },
  roles: [roleEntrySchema],
  updatedAt: { type: Date, default: Date.now }
});

customSetupSchema.index({ guildId: 1 });

module.exports = mongoose.model('CustomSetup', customSetupSchema);
