const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'samurai_db.json');

// Global memory cache of collections
let dbState = {};

function loadData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbState = JSON.parse(raw);
    } else {
      dbState = {};
    }
  } catch (err) {
    console.error('Error loading embedded DB file:', err.message);
    dbState = {};
  }
}

let saveTimer = null;
function persistData() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
    } catch (err) {
      console.error('Error persisting embedded DB:', err.message);
    }
  }, 100);
}

loadData();

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

function matchCondition(val, condition) {
  if (condition === undefined || condition === null) {
    return val === condition;
  }
  if (typeof condition === 'object' && !(condition instanceof Date)) {
    if (condition.$in) {
      const arr = condition.$in.map(String);
      return arr.includes(String(val));
    }
    if (condition.$nin) {
      const arr = condition.$nin.map(String);
      return !arr.includes(String(val));
    }
    if (condition.$ne !== undefined) {
      return String(val) !== String(condition.$ne);
    }
    if (condition.$regex) {
      const reg = new RegExp(condition.$regex, condition.$options || 'i');
      return reg.test(String(val || ''));
    }
    if (condition.$gte !== undefined || condition.$lte !== undefined || condition.$gt !== undefined || condition.$lt !== undefined) {
      const v = (val instanceof Date) ? val.getTime() : (typeof val === 'number' ? val : (new Date(val).getTime() || val));
      if (condition.$gte !== undefined) {
        const target = (condition.$gte instanceof Date) ? condition.$gte.getTime() : (typeof condition.$gte === 'number' ? condition.$gte : new Date(condition.$gte).getTime());
        if (v < target) return false;
      }
      if (condition.$lte !== undefined) {
        const target = (condition.$lte instanceof Date) ? condition.$lte.getTime() : (typeof condition.$lte === 'number' ? condition.$lte : new Date(condition.$lte).getTime());
        if (v > target) return false;
      }
      if (condition.$gt !== undefined) {
        const target = (condition.$gt instanceof Date) ? condition.$gt.getTime() : (typeof condition.$gt === 'number' ? condition.$gt : new Date(condition.$gt).getTime());
        if (v <= target) return false;
      }
      if (condition.$lt !== undefined) {
        const target = (condition.$lt instanceof Date) ? condition.$lt.getTime() : (typeof condition.$lt === 'number' ? condition.$lt : new Date(condition.$lt).getTime());
        if (v >= target) return false;
      }
      return true;
    }
  }
  return String(val) === String(condition);
}

function matchesFilter(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  if (filter.$or && Array.isArray(filter.$or)) {
    const orMatched = filter.$or.some(subFilter => matchesFilter(doc, subFilter));
    if (!orMatched) return false;
  }

  if (filter.$and && Array.isArray(filter.$and)) {
    const andMatched = filter.$and.every(subFilter => matchesFilter(doc, subFilter));
    if (!andMatched) return false;
  }

  for (const key of Object.keys(filter)) {
    if (key === '$or' || key === '$and') continue;

    let val;
    if (key.includes('.')) {
      const parts = key.split('.');
      val = parts.reduce((o, p) => (o ? o[p] : undefined), doc);
    } else {
      val = doc[key];
    }

    const cond = filter[key];
    if (!matchCondition(val, cond)) {
      return false;
    }
  }
  return true;
}

class Document {
  constructor(data, model) {
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        this[k] = v;
      }
    }
    if (!this._id) {
      this._id = generateId();
    } else {
      this._id = String(this._id);
    }
    if (!this.createdAt) this.createdAt = new Date().toISOString();
    if (!this.updatedAt) this.updatedAt = new Date().toISOString();
    Object.defineProperty(this, '__model', { value: model, enumerable: false, writable: true });
  }

  toObject() {
    const copy = {};
    for (const key of Object.keys(this)) {
      if (key === '__model') continue;
      const val = this[key];
      if (val && typeof val === 'object') {
        if (val instanceof Date) {
          copy[key] = val.toISOString();
        } else if (typeof val.toObject === 'function') {
          copy[key] = val.toObject();
        } else if (Array.isArray(val)) {
          copy[key] = val.map(item => (item && typeof item.toObject === 'function') ? item.toObject() : item);
        } else {
          copy[key] = { ...val };
        }
      } else {
        copy[key] = val;
      }
    }
    return copy;
  }

  toJSON() {
    return this.toObject();
  }

  async populate(field, select) {
    let path = typeof field === 'object' && field.path ? field.path : field;
    if (typeof path === 'string') {
      const parts = path.split(' ');
      for (const p of parts) {
        const prop = p.trim();
        if (!prop) continue;
        const refModelName = this.__model && this.__model.schemaRefs ? this.__model.schemaRefs[prop] : null;
        if (refModelName && modelsRegistry[refModelName]) {
          const targetModel = modelsRegistry[refModelName];
          const foreignId = this[prop];
          if (foreignId) {
            const targetDoc = targetModel.getCollection().find(d => String(d._id) === String(foreignId));
            if (targetDoc) {
              this[prop] = new Document(targetDoc, targetModel);
            }
          }
        }
      }
    }
    return this;
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    const collection = this.__model.getCollection();
    const idx = collection.findIndex(item => String(item._id) === String(this._id));
    const cleanData = this.toObject();
    if (idx >= 0) {
      collection[idx] = cleanData;
    } else {
      collection.push(cleanData);
    }
    persistData();
    return this;
  }
}

class Query {
  constructor(model, filter = {}, isFindOne = false) {
    this.model = model;
    this.filter = filter;
    this.isFindOne = isFindOne;
    this.populateFields = [];
    this.sortCriteria = null;
    this.limitCount = null;
    this.skipCount = 0;
    this.selectFields = null;
  }

  populate(field, select) {
    if (typeof field === 'object' && field.path) {
      this.populateFields.push({ path: field.path, select: field.select });
    } else if (typeof field === 'string') {
      const parts = field.split(' ');
      parts.forEach(p => {
        if (p.trim()) this.populateFields.push({ path: p.trim(), select });
      });
    }
    return this;
  }

  sort(criteria) {
    this.sortCriteria = criteria;
    return this;
  }

  limit(count) {
    this.limitCount = Number(count);
    return this;
  }

  skip(count) {
    this.skipCount = Number(count);
    return this;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  async exec() {
    const collection = this.model.getCollection();
    let results = collection.filter(doc => matchesFilter(doc, this.filter));

    // Sort
    if (this.sortCriteria) {
      results.sort((a, b) => {
        if (typeof this.sortCriteria === 'string') {
          const keys = this.sortCriteria.split(' ');
          for (let k of keys) {
            let asc = true;
            if (k.startsWith('-')) {
              asc = false;
              k = k.substring(1);
            }
            if (a[k] < b[k]) return asc ? -1 : 1;
            if (a[k] > b[k]) return asc ? 1 : -1;
          }
        } else if (typeof this.sortCriteria === 'object') {
          for (const [k, dir] of Object.entries(this.sortCriteria)) {
            const asc = Number(dir) >= 0;
            if (a[k] < b[k]) return asc ? -1 : 1;
            if (a[k] > b[k]) return asc ? 1 : -1;
          }
        }
        return 0;
      });
    }

    if (this.skipCount > 0) {
      results = results.slice(this.skipCount);
    }
    if (this.limitCount !== null && this.limitCount >= 0) {
      results = results.slice(0, this.limitCount);
    }

    // Convert to Document instances
    let docList = results.map(item => new Document(item, this.model));

    // Populate
    if (this.populateFields.length > 0) {
      for (const pop of this.populateFields) {
        const refModelName = this.model.schemaRefs[pop.path];
        if (refModelName && modelsRegistry[refModelName]) {
          const targetModel = modelsRegistry[refModelName];
          for (const doc of docList) {
            const foreignId = doc[pop.path];
            if (foreignId) {
              const targetDoc = targetModel.getCollection().find(d => String(d._id) === String(foreignId));
              if (targetDoc) {
                doc[pop.path] = new Document(targetDoc, targetModel);
              }
            }
          }
        }
      }
    }

    if (this.isFindOne) {
      return docList.length > 0 ? docList[0] : null;
    }
    return docList;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

const modelsRegistry = {};

class EmbeddedModel {
  constructor(name, schemaRefs = {}) {
    this.name = name;
    this.schemaRefs = schemaRefs;
    modelsRegistry[name] = this;
    if (!dbState[this.name]) {
      dbState[this.name] = [];
    }
  }

  getCollection() {
    if (!dbState[this.name]) {
      dbState[this.name] = [];
    }
    return dbState[this.name];
  }

  find(filter = {}) {
    return new Query(this, filter, false);
  }

  findOne(filter = {}) {
    return new Query(this, filter, true);
  }

  findById(id) {
    return new Query(this, { _id: String(id) }, true);
  }

  async create(data) {
    if (Array.isArray(data)) {
      const created = [];
      for (const item of data) {
        const doc = new Document(item, this);
        await doc.save();
        created.push(doc);
      }
      return created;
    }
    const doc = new Document(data, this);
    await doc.save();
    return doc;
  }

  async insertMany(docs) {
    return this.create(docs);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const doc = await this.findById(id).exec();
    if (!doc) return null;

    let payload = update;
    if (update.$set) payload = { ...payload, ...update.$set };
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        doc[k] = (Number(doc[k]) || 0) + Number(v);
      }
    }
    delete payload.$set;
    delete payload.$inc;

    Object.assign(doc, payload);
    await doc.save();
    return doc;
  }

  async updateOne(filter, update) {
    const doc = await this.findOne(filter).exec();
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };
    let payload = update;
    if (update.$set) payload = { ...payload, ...update.$set };
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        doc[k] = (Number(doc[k]) || 0) + Number(v);
      }
    }
    delete payload.$set;
    delete payload.$inc;

    Object.assign(doc, payload);
    await doc.save();
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(filter, update) {
    const docs = await this.find(filter).exec();
    for (const doc of docs) {
      let payload = update;
      if (update.$set) payload = { ...payload, ...update.$set };
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          doc[k] = (Number(doc[k]) || 0) + Number(v);
        }
      }
      delete payload.$set;
      delete payload.$inc;
      Object.assign(doc, payload);
      await doc.save();
    }
    return { matchedCount: docs.length, modifiedCount: docs.length };
  }

  async findByIdAndDelete(id) {
    const doc = await this.findById(id).exec();
    if (!doc) return null;
    const col = this.getCollection();
    const idx = col.findIndex(item => String(item._id) === String(id));
    if (idx >= 0) {
      col.splice(idx, 1);
      persistData();
    }
    return doc;
  }

  async deleteOne(filter) {
    const doc = await this.findOne(filter).exec();
    if (!doc) return { deletedCount: 0 };
    return this.findByIdAndDelete(doc._id).then(() => ({ deletedCount: 1 }));
  }

  async deleteMany(filter = {}) {
    const col = this.getCollection();
    if (Object.keys(filter).length === 0) {
      const count = col.length;
      dbState[this.name] = [];
      persistData();
      return { deletedCount: count };
    }
    const toKeep = col.filter(doc => !matchesFilter(doc, filter));
    const deletedCount = col.length - toKeep.length;
    dbState[this.name] = toKeep;
    persistData();
    return { deletedCount };
  }

  async countDocuments(filter = {}) {
    const col = this.getCollection();
    return col.filter(doc => matchesFilter(doc, filter)).length;
  }
}

module.exports = {
  EmbeddedModel,
  modelsRegistry,
  persistData,
  loadData,
  DATA_DIR
};
