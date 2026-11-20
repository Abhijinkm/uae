const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  membership: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentMembership' },
  amount: { type: Number, required: true }, // Package total price
  paidAmount: { type: Number, required: true }, // Amount paid in this transaction
  balance: { type: Number, default: 0 }, // Remaining balance
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Online / UPI / Card'],
    default: 'Cash'
  },
  transactionReference: { type: String, default: '' },
  paymentDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['completed', 'partial', 'pending', 'refunded'],
    default: 'completed'
  },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' }
}, { timestamps: true });

paymentSchema.index({ student: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: -1, branch: 1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
