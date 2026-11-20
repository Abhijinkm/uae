const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  specialization: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.Instructor || mongoose.model('Instructor', instructorSchema);

