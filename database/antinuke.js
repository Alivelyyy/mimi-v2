const mongoose = require('mongoose');

const moduleSchema = (defaultLimit = 3) => ({
  enabled: { type: Boolean, default: true },
  limit: { type: Number, default: defaultLimit, min: 1, max: 20 },
});

const toggleOnlySchema = () => ({
  enabled: { type: Boolean, default: true },
});

const antinukeSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  logChannelId: { type: String, default: null },
  quarantineRoleId: { type: String, default: null },
  whitelist: [{ type: String }],
  punishment: { type: String, default: 'ban', enum: ['ban', 'kick', 'strip', 'quarantine'] },
  modules: {
    antiban: moduleSchema(3),
    antikick: moduleSchema(3),
    antichanneldelete: moduleSchema(3),
    antichannelcreate: moduleSchema(5),
    antiroledelete: moduleSchema(3),
    antirolecreate: moduleSchema(5),
    antiwebhook: moduleSchema(3),
    antibot: toggleOnlySchema(),
    antiserverupdate: toggleOnlySchema(),
    antimemberupdate: toggleOnlySchema(),
    antiemoji: moduleSchema(3),
    antiprune: toggleOnlySchema(),
  },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Antinuke', antinukeSchema);
