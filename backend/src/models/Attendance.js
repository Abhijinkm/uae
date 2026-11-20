const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  time: { type: String, default: '00:00' },
  status: { type: String, enum: ['Present', 'Absent', 'Leave'], default: 'Present' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  membershipCycle: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentMembership' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

// Prevent duplicate attendance for same student on same date
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, branch: 1, batch: 1 });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

