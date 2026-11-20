const { Payment, Student, StudentMembership, Settings, AuditLog } = require('../models');
const { generateReceiptNumber } = require('../services/membershipService');

// @desc    Record a new payment for student membership
// @route   POST /api/payments
// @access  Private
async function recordPayment(req, res) {
  try {
    const {
      studentId,
      membershipId,
      paidAmount,
      paymentMethod = 'Cash',
      transactionReference = '',
      paymentDate = new Date(),
      notes = ''
    } = req.body;

    if (!studentId || paidAmount === undefined || Number(paidAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Student ID and valid payment amount are required' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const memId = membershipId || student.currentMembership;
    let membership = null;
    if (memId) {
      membership = await StudentMembership.findById(memId);
    }

    const paymentAmount = Number(paidAmount);
    let totalFee = membership ? Number(membership.packageAmount) : paymentAmount;
    let currentBalance = membership ? Number(membership.balanceDue) : 0;

    // Calculate new balance
    let newBalance = Math.max(0, currentBalance - paymentAmount);

    if (membership) {
      membership.totalPaid = (Number(membership.totalPaid) || 0) + paymentAmount;
      membership.balanceDue = newBalance;
      membership.paymentStatus = newBalance === 0 ? 'paid' : 'partial';
      await membership.save();
    }

    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create({
      receiptNumber,
      student: student._id,
      membership: membership ? membership._id : null,
      amount: totalFee,
      paidAmount: paymentAmount,
      balance: newBalance,
      paymentMethod,
      transactionReference,
      paymentDate: new Date(paymentDate),
      status: newBalance === 0 ? 'completed' : 'partial',
      branch: student.branch,
      receivedBy: req.user ? req.user._id : null,
      notes
    });

    await AuditLog.create({
      action: 'RECORD_PAYMENT',
      performedBy: req.user ? req.user._id : null,
      targetId: String(payment._id),
      targetType: 'Payment',
      details: {
        receiptNumber,
        studentId: student.studentId,
        studentName: student.name,
        paidAmount: paymentAmount,
        newBalance,
        paymentMethod
      }
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('student', 'name studentId phone')
      .populate('membership', 'packageName')
      .populate('receivedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: populatedPayment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Get payments with search, date range & branch filters
// @route   GET /api/payments
// @access  Private
async function getPayments(req, res) {
  try {
    const { startDate, endDate, branch, paymentMethod, search } = req.query;
    const filter = {};

    if (branch) filter.branch = branch;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = endD;
      }
    }

    let payments = await Payment.find(filter)
      .populate('student', 'name studentId phone email photo')
      .populate('membership', 'packageName')
      .populate('branch', 'name code')
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      payments = payments.filter(p => {
        const sName = p.student ? p.student.name.toLowerCase() : '';
        const sId = p.student ? p.student.studentId.toLowerCase() : '';
        const rNum = p.receiptNumber ? p.receiptNumber.toLowerCase() : '';
        return sName.includes(q) || sId.includes(q) || rNum.includes(q);
      });
    }

    // Totals summary
    let totalRevenue = 0;
    payments.forEach(p => {
      totalRevenue += Number(p.paidAmount) || 0;
    });

    res.json({
      success: true,
      count: payments.length,
      totalRevenue,
      data: payments
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Get detailed receipt data for printing or download
// @route   GET /api/payments/:id/receipt
// @access  Private
async function getPaymentReceipt(req, res) {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student')
      .populate('membership')
      .populate('branch')
      .populate('receivedBy', 'name email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = {
        academyName: 'Samurai Martial Arts Academy',
        tagline: 'Discipline • Strength • Honor',
        address: '742 Martial Arts Blvd, Sector 4',
        phone: '+1 (555) 234-5678',
        email: 'info@samuraiacademy.com',
        currency: '$'
      };
    }

    res.json({
      success: true,
      receipt: {
        receiptNumber: payment.receiptNumber,
        paymentDate: payment.paymentDate,
        student: {
          id: payment.student ? payment.student._id : '',
          studentCode: payment.student ? payment.student.studentId : '',
          name: payment.student ? payment.student.name : 'Unknown',
          phone: payment.student ? payment.student.phone : '',
          email: payment.student ? payment.student.email : '',
          address: payment.student ? payment.student.address : ''
        },
        membership: payment.membership ? {
          packageName: payment.membership.packageName,
          startDate: payment.membership.startDate,
          expiryDate: payment.membership.expiryDate
        } : null,
        amount: payment.amount,
        paidAmount: payment.paidAmount,
        balance: payment.balance,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        status: payment.status,
        receivedBy: payment.receivedBy ? payment.receivedBy.name : 'Authorized Staff',
        notes: payment.notes,
        academy: {
          name: settings.academyName,
          tagline: settings.tagline,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          currency: settings.currency || '$'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  recordPayment,
  getPayments,
  getPaymentReceipt
};

