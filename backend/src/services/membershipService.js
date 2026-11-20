const { Student, StudentMembership, MembershipPackage, Attendance, Payment, AuditLog } = require('../models');
const { calculateExpiryDate, formatDate, getDaysUntilExpiry, getMembershipStatus } = require('../utils/dateUtils');

/**
 * Generate unique receipt number e.g. REC-20261119-4821
 */
function generateReceiptNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REC-${dateStr}-${rand}`;
}

/**
 * Create initial membership for student
 */
async function createMembershipForStudent({
  studentId,
  packageId,
  startDate = new Date(),
  totalPaid = 0,
  paymentMethod = 'Cash',
  transactionReference = '',
  receivedBy = null,
  branchId = null,
  notes = ''
}) {
  const pkg = await MembershipPackage.findById(packageId);
  if (!pkg) {
    throw new Error('Selected membership package not found');
  }

  const start = new Date(startDate);
  const expiry = calculateExpiryDate(start, pkg.durationMonths, pkg.durationDays);
  const nextRenewal = new Date(expiry);

  const amount = Number(pkg.feeAmount) || 0;
  const paid = Number(totalPaid) || 0;
  const balance = Math.max(0, amount - paid);

  let paymentStatus = 'pending';
  if (paid >= amount) {
    paymentStatus = 'paid';
  } else if (paid > 0) {
    paymentStatus = 'partial';
  }

  // Count existing cycles for this student
  const existingCount = await StudentMembership.countDocuments({ student: studentId });
  const cycleNumber = existingCount + 1;

  // Initial remaining classes
  const remaining = pkg.classLimit ? pkg.classLimit : null;

  const membership = await StudentMembership.create({
    student: studentId,
    package: pkg._id,
    packageName: pkg.name,
    packageAmount: amount,
    startDate: start,
    expiryDate: expiry,
    nextRenewalDate: nextRenewal,
    classLimit: pkg.classLimit || null,
    attendedClasses: 0,
    remainingClasses: remaining,
    status: 'active',
    paymentStatus,
    totalPaid: paid,
    balanceDue: balance,
    cycleNumber,
    notes
  });

  // If initial payment was made, generate payment record & receipt
  let paymentDoc = null;
  if (paid > 0) {
    paymentDoc = await Payment.create({
      receiptNumber: generateReceiptNumber(),
      student: studentId,
      membership: membership._id,
      amount,
      paidAmount: paid,
      balance,
      paymentMethod,
      transactionReference,
      paymentDate: new Date(),
      status: paid >= amount ? 'completed' : 'partial',
      branch: branchId,
      receivedBy,
      notes: notes || `Initial package payment: ${pkg.name}`
    });
  }

  // Update student's current membership & package
  await Student.findByIdAndUpdate(studentId, {
    currentPackage: pkg._id,
    currentMembership: membership._id,
    status: 'active'
  });

  // Audit log
  await AuditLog.create({
    action: 'CREATE_MEMBERSHIP',
    performedBy: receivedBy,
    targetId: String(membership._id),
    targetType: 'StudentMembership',
    details: {
      studentId,
      packageName: pkg.name,
      amount,
      paid,
      expiryDate: expiry
    }
  });

  return { membership, payment: paymentDoc };
}

/**
 * Recalculate attendance stats for a student against their current membership period
 */
async function recalculateAttendanceForMembership(studentId, membershipId) {
  const membership = await StudentMembership.findById(membershipId);
  if (!membership) return null;

  const startStr = formatDate(membership.startDate);
  const expiryStr = formatDate(membership.expiryDate);

  // Find all present attendance within this period
  const attendances = await Attendance.find({
    student: studentId,
    status: 'Present',
    date: { $gte: startStr, $lte: expiryStr }
  });

  const attendedCount = attendances.length;
  membership.attendedClasses = attendedCount;

  if (membership.classLimit !== null && membership.classLimit !== undefined) {
    membership.remainingClasses = Math.max(0, Number(membership.classLimit) - attendedCount);
  }

  // Update status based on dates & remaining classes
  membership.status = getMembershipStatus(membership.expiryDate, membership.classLimit, attendedCount);
  await membership.save();

  // If expired, update student status as well
  if (membership.status === 'expired') {
    await Student.findByIdAndUpdate(studentId, { status: 'inactive' });
  }

  return membership;
}

/**
 * Renew student membership (creates a new cycle, archives old)
 */
async function renewStudentMembership({
  studentId,
  packageId,
  startDate = new Date(),
  totalPaid = 0,
  paymentMethod = 'Cash',
  transactionReference = '',
  receivedBy = null,
  branchId = null,
  notes = ''
}) {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Mark current active membership as 'renewed'
  if (student.currentMembership) {
    await StudentMembership.findByIdAndUpdate(student.currentMembership, {
      status: 'renewed'
    });
  }

  const result = await createMembershipForStudent({
    studentId,
    packageId,
    startDate,
    totalPaid,
    paymentMethod,
    transactionReference,
    receivedBy,
    branchId: branchId || student.branch,
    notes
  });

  await AuditLog.create({
    action: 'RENEW_MEMBERSHIP',
    performedBy: receivedBy,
    targetId: String(result.membership._id),
    targetType: 'StudentMembership',
    details: {
      studentId,
      packageName: result.membership.packageName,
      cycleNumber: result.membership.cycleNumber
    }
  });

  return result;
}

/**
 * Daily background job to check memberships and update expiry states
 */
async function runAutomatedExpiryCheck() {
  const activeMemberships = await StudentMembership.find({
    status: { $in: ['active', 'expiring_soon'] }
  });

  let expiredCount = 0;
  let expiringSoonCount = 0;

  for (const mem of activeMemberships) {
    const daysLeft = getDaysUntilExpiry(mem.expiryDate);
    const isClassExhausted = mem.classLimit !== null && mem.remainingClasses !== null && mem.remainingClasses <= 0;

    if (daysLeft < 0 || isClassExhausted) {
      mem.status = 'expired';
      await mem.save();
      await Student.findByIdAndUpdate(mem.student, { status: 'inactive' });
      expiredCount++;
    } else if (daysLeft <= 7 && mem.status !== 'expiring_soon') {
      mem.status = 'expiring_soon';
      await mem.save();
      expiringSoonCount++;
    }
  }

  console.log(`[Automated Expiry Check] Completed. Expired: ${expiredCount}, Expiring soon: ${expiringSoonCount}`);
  return { expiredCount, expiringSoonCount };
}

module.exports = {
  generateReceiptNumber,
  createMembershipForStudent,
  recalculateAttendanceForMembership,
  renewStudentMembership,
  runAutomatedExpiryCheck
};

