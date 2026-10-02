const mongoose = require('mongoose');

const adminListSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  admins: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminList', adminListSchema);
