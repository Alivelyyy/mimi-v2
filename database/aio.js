const mongoose = require('mongoose');

const aioSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  enabledAt: { type: Date, default: null },
  enabledBy: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now }
});

aioSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('AIO', aioSchema);
