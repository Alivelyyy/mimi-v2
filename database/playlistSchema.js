
const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  uri: { type: String, required: true },
  duration: { type: Number, default: 0 },
  thumbnail: { type: String, default: null },
  author: { type: String, default: 'Unknown' },
  requester: { type: String, required: true },
  addedAt: { type: Date, default: Date.now }
});

const playlistSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: false },
  name: { type: String, required: true },
  tracks: [trackSchema],
  isPublic: { type: Boolean, default: false },
  shareCode: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Create compound unique index only
playlistSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Playlist', playlistSchema);
