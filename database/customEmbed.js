const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  inline: { type: Boolean, default: false }
}, { _id: false });

const customEmbedSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  title: { type: String, default: null },
  description: { type: String, default: null },
  color: { type: String, default: null },
  footer: { type: String, default: null },
  footerIcon: { type: String, default: null },
  image: { type: String, default: null },
  thumbnail: { type: String, default: null },
  author: { type: String, default: null },
  authorIcon: { type: String, default: null },
  authorUrl: { type: String, default: null },
  url: { type: String, default: null },
  fields: [fieldSchema],
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

customEmbedSchema.index({ guildId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CustomEmbed', customEmbedSchema);
