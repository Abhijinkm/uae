const mongoose = require('mongoose');

const membershipPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['monthly', 'class_pack', 'custom'], default: 'monthly' },
  durationMonths: { type: Number, default: 1 },
  durationDays: { type: Number, default: 0 },
  classLimit: { type: Number, default: null }, // null means unlimited classes
  feeAmount: { type: Number, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.MembershipPackage || mongoose.model('MembershipPackage', membershipPackageSchema);

