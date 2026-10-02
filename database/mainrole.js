const mongoose = require('mongoose');

const mainroleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  roles: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MainRole', mainroleSchema);
