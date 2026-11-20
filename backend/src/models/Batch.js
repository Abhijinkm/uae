const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  days: [{ type: String }],
  startTime: { type: String },
  endTime: { type: String },
  capacity: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.Batch || mongoose.model('Batch', batchSchema);

