const { MembershipPackage, StudentMembership, Student, AuditLog } = require('../models');
const { renewStudentMembership } = require('../services/membershipService');
const { calculateExpiryDate, formatDate } = require('../utils/dateUtils');

// @desc    Get all membership packages
// @route   GET /api/memberships/packages
// @access  Public (or Private)
async function getPackages(req, res) {
  try {
    const all = await MembershipPackage.find().sort({ feeAmount: 1 });
    const packages = all.filter(p => p.isActive !== false);
    res.json({ success: true, count: packages.length, data: packages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Create a new membership package
// @route   POST /api/memberships/packages
// @access  Private (Admin)
async function createPackage(req, res) {
  try {
    const { name, type, durationMonths, durationDays, classLimit, feeAmount, description } = req.body;
    if (!name || feeAmount === undefined) {
      return res.status(400).json({ success: false, message: 'Package name and fee amount are required' });
    }

    const pkg = await MembershipPackage.create({
      name,
      type: type || 'monthly',
      durationMonths: Number(durationMonths) || 1,
      durationDays: Number(durationDays) || 0,
      classLimit: classLimit ? Number(classLimit) : null,
      feeAmount: Number(feeAmount),
      description: description || '',
      isActive: true
    });

    res.status(201).json({ success: true, message: 'Package created successfully', data: pkg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Update a membership package
// @route   PUT /api/memberships/packages/:id
// @access  Private (Admin)
async function updatePackage(req, res) {
  try {
    const pkg = await MembershipPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.json({ success: true, message: 'Package updated', data: pkg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Delete (or deactivate) a membership package
// @route   DELETE /api/memberships/packages/:id
// @access  Private (Admin)
async function deletePackage(req, res) {
  try {
    const pkg = await MembershipPackage.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.json({ success: true, message: 'Package deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Preview Date-to-Date calculation
// @route   POST /api/memberships/calculate-dates
// @access  Private
async function previewDateCalculation(req, res) {
  try {
    const { startDate, durationMonths = 1, durationDays = 0 } = req.body;
    const start = startDate ? new Date(startDate) : new Date();
    const expiry = calculateExpiryDate(start, Number(durationMonths), Number(durationDays));

    res.json({
      success: true,
      startDate: formatDate(start),
      expiryDate: formatDate(expiry),
      nextRenewalDate: formatDate(expiry)
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// @desc    Renew student membership
// @route   POST /api/memberships/renew
// @access  Private
async function renewMembership(req, res) {
  try {
    const {
      studentId,
      packageId,
      startDate,
      totalPaid,
      paymentMethod,
      transactionReference,
      notes
    } = req.body;

    if (!studentId || !packageId) {
      return res.status(400).json({ success: false, message: 'Student ID and Package ID are required' });
    }

    const result = await renewStudentMembership({
      studentId,
      packageId,
      startDate: startDate || new Date(),
      totalPaid: Number(totalPaid) || 0,
      paymentMethod: paymentMethod || 'Cash',
      transactionReference: transactionReference || '',
      receivedBy: req.user ? req.user._id : null,
      notes: notes || 'Membership renewal'
    });

    res.json({
      success: true,
      message: 'Membership renewed successfully',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  previewDateCalculation,
  renewMembership
};

