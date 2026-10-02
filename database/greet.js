const mongoose = require('mongoose');

const greetSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  message: { type: String, default: 'Welcome {user} to **{server}**! You are member #{count}!' },
  autoDelete: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Greet', greetSchema);
