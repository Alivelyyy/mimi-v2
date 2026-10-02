const mongoose = require('mongoose');

const vanityRolesSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  vanityUrls: [{ type: String }],
  roleId: { type: String, default: null },
  channelId: { type: String, default: null },
  welcomeMessage: { type: String, default: '{user} thank you for repping **{server}**! You have been given the {role} role.' },
  removeMessage: { type: String, default: '{user} removed the vanity from their status. The {role} role has been removed.' },
  trackedUsers: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VanityRoles', vanityRolesSchema);
