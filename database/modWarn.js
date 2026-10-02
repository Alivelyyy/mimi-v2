const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  warnings: [
    {
      warnId: { type: String, required: true },
      moderatorId: { type: String, required: true },
      reason: { type: String, default: 'No reason provided' },
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

warnSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ModWarn', warnSchema);
