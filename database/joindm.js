const mongoose = require('mongoose');

const joindmSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  message: { type: String, default: 'Welcome to {server}!' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JoinDM', joindmSchema);
