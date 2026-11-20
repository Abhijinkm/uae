const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'student'], default: 'staff' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  phone: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

