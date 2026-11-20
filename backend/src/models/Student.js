const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  art: { type: String, trim: true, default: 'Karate' },
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  address: { type: String, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  dateOfBirth: { type: Date },
  joiningDate: { type: Date, default: Date.now },
  photo: { type: String, default: '' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' },
  currentPackage: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPackage' },
  currentMembership: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentMembership' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relation: { type: String }
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

studentSchema.index({ branch: 1, batch: 1, status: 1 });

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);
