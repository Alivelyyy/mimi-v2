const mongoose = require("mongoose");

const afkSchema = new mongoose.Schema({
  userId:   { type: String, required: true },
  guildId:  { type: String, default: null },
  isGlobal: { type: Boolean, default: false },
  reason:   { type: String, default: "AFK" },
  timestamp:{ type: Number, default: () => Date.now() },
});

afkSchema.index({ userId: 1, guildId: 1 }, { unique: true });
afkSchema.index({ userId: 1, isGlobal: 1 });

const AfkModel = mongoose.model("Afk", afkSchema);

async function setAfk(userId, guildId, reason, isGlobal) {
  const query = isGlobal
    ? { userId, isGlobal: true }
    : { userId, guildId };

  await AfkModel.findOneAndUpdate(
    query,
    { userId, guildId: isGlobal ? null : guildId, isGlobal, reason, timestamp: Date.now() },
    { upsert: true, new: true }
  );
}

async function getAfk(userId, guildId) {
  const [global, server] = await Promise.all([
    AfkModel.findOne({ userId, isGlobal: true }).lean(),
    AfkModel.findOne({ userId, guildId, isGlobal: false }).lean(),
  ]);
  return { global, server };
}

async function removeAfk(userId, guildId) {
  await Promise.all([
    AfkModel.deleteOne({ userId, isGlobal: true }),
    AfkModel.deleteOne({ userId, guildId, isGlobal: false }),
  ]);
}

async function isAfk(userId, guildId) {
  const { global, server } = await getAfk(userId, guildId);
  return global || server || null;
}

module.exports = { setAfk, getAfk, removeAfk, isAfk };
