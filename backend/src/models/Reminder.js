const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  membership: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentMembership' },
  type: {
    type: String,
    enum: ['7_days_before', '3_days_before', '1_day_before', 'on_expiry', 'expired'],
    required: true
  },
  channel: {
    type: String,
    enum: ['whatsapp', 'sms', 'in_app'],
    default: 'in_app'
  },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'sent'
  },
  sentAt: { type: Date, default: Date.now },
  scheduledDate: { type: Date, default: Date.now }
}, { timestamps: true });

reminderSchema.index({ student: 1, type: 1, scheduledDate: 1 });

module.exports = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);

