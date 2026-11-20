const mongoose = require('mongoose');

const studentMembershipSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPackage', required: true },
  packageName: { type: String, required: true },
  packageAmount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  nextRenewalDate: { type: Date, required: true },
  classLimit: { type: Number, default: null }, // null = unlimited
  attendedClasses: { type: Number, default: 0 },
  remainingClasses: { type: Number, default: null },
  status: {
    type: String,
    enum: ['active', 'expiring_soon', 'expired', 'renewed'],
    default: 'active'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'pending'],
    default: 'pending'
  },
  totalPaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  cycleNumber: { type: Number, default: 1 },
  notes: { type: String }
}, { timestamps: true });

// Useful indexes for querying active memberships and expiry reminders
studentMembershipSchema.index({ student: 1, status: 1 });
studentMembershipSchema.index({ expiryDate: 1, status: 1 });

module.exports = mongoose.models.StudentMembership || mongoose.model('StudentMembership', studentMembershipSchema);

