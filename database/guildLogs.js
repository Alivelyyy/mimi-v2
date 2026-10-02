const mongoose = require('mongoose');

const guildLogsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channels: {
    moderation: { type: String, default: null },
    messages: { type: String, default: null },
    members: { type: String, default: null },
    voice: { type: String, default: null },
    server: { type: String, default: null },
    joins: { type: String, default: null },
    leaves: { type: String, default: null }
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GuildLogs', guildLogsSchema);
