const mongoose = require('mongoose');

const j2cSettingSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  triggerChannelId: { type: String, required: true },
  categoryId: { type: String, default: null },
  defaultName: { type: String, default: '{user}\'s Channel' },
  defaultLimit: { type: Number, default: 0 },
  defaultBitrate: { type: Number, default: 64000 },
  defaultRegion: { type: String, default: null },
  interfaceEnabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const j2cChannelSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  locked: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  bannedUsers: [{ type: String }],
  permittedUsers: [{ type: String }],
  bitrate: { type: Number, default: 64000 },
  region: { type: String, default: null },
  status: { type: String, default: null },
  interfaceMessageId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  J2CSetting: mongoose.model('J2CSetting', j2cSettingSchema),
  J2CChannel: mongoose.model('J2CChannel', j2cChannelSchema)
};
