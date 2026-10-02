const mongoose = require('mongoose');

const datingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  name: { type: String, default: null },
  bio: { type: String, default: 'No bio set.' },
  picture: { type: String, default: null },
  gender: { type: String, default: null, enum: ['male', 'female', 'other', null] },
  looking: { type: String, default: null, enum: ['male', 'female', 'other', 'any', null] },
  age: { type: Number, default: null, min: 13, max: 100 },
  interests: [{ type: String }],
  giftsReceived: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  matchedWith: { type: String, default: null },
  likes: [{ type: String }],
  likedBy: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

datingSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('Dating', datingSchema);
