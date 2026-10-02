const mongoose = require('mongoose');

const models = {};

function getModel(name) {
  if (models[name]) return models[name];

  const schema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null }
  }, { collection: name, timestamps: true });

  models[name] = mongoose.model(`kv_${name}`, schema);
  return models[name];
}

function createKVStore(collectionName) {
  const Model = getModel(collectionName);

  const store = {
    async get(key) {
      const doc = await Model.findOne({ key });
      return doc ? doc.value : null;
    },

    async set(key, value) {
      await Model.updateOne({ key }, { key, value }, { upsert: true });
      return store;
    },

    async delete(key) {
      await Model.deleteOne({ key });
      return store;
    },

    async has(key) {
      const count = await Model.countDocuments({ key });
      return count > 0;
    },

    get keys() {
      return Model.find({}).then(docs => docs.map(d => d.key));
    },

    async list() {
      const docs = await Model.find({});
      return docs.map(d => d.key);
    },

    async push(key, value, allowDuplicates = true) {
      const doc = await Model.findOne({ key });
      let arr = doc?.value || [];
      if (!Array.isArray(arr)) arr = [];
      if (!allowDuplicates && arr.includes(value)) return store;
      arr.push(value);
      await Model.updateOne({ key }, { key, value: arr }, { upsert: true });
      return store;
    },

    async remove(key, value) {
      const doc = await Model.findOne({ key });
      if (!doc || !Array.isArray(doc.value)) return store;
      const arr = doc.value.filter(v => v !== value);
      await Model.updateOne({ key }, { value: arr });
      return store;
    },

    async size() {
      return Model.countDocuments({});
    },

    async clear() {
      await Model.deleteMany({});
      return store;
    },

    async entries() {
      const docs = await Model.find({});
      return docs.map(d => [d.key, d.value]);
    }
  };

  return store;
}

module.exports = { createKVStore };
