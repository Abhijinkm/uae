const { Student, StudentMembership, Attendance, Payment, Branch } = require('../models');
const { formatDate } = require('../utils/dateUtils');

// @desc    Daily attendance report
// @route   GET /api/reports/daily-attendance
// @access  Private
async function getDailyAttendanceReport(req, res) {
  try {
    const { date, branch } = req.query;
    const targetDate = date ? formatDate(new Date(date)) : formatDate(new Date());

    const filter = { date: targetDate };
    if (branch) filter.branch = branch;

    const records = await Attendance.find(filter)
      .populate('student', 'name studentId phone branch batch')
      .populate('branch', 'name')
      .populate('batch', 'name')
      .sort({ time: 1 });

    const summary = {
      date: targetDate,
      totalMarked: records.length,
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      leave: records.filter(r => r.status === 'Leave').length
    };

    res.json({
      success: true,
      summary,
      data: records.map(r => ({
        date: r.date,
        time: r.time,
        studentId: r.student ? r.student.studentId : '',
        studentName: r.student ? r.student.name : 'Unknown',
        phone: r.student ? r.student.phone : '',
        branchName: r.branch ? r.branch.name : '',
        batchName: r.batch ? r.batch.name : '',
        status: r.status,
        remarks: r.remarks || ''
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Monthly fee collection report
// @route   GET /api/reports/monthly-fees
// @access  Private
async function getMonthlyFeeReport(req, res) {
  try {
    const { year, month, branch } = req.query;
    const now = new Date();
    const targetYear = year ? Number(year) : now.getFullYear();
    const targetMonth = month ? Number(month) - 1 : now.getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const filter = {
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth }
    };
    if (branch) filter.branch = branch;

    const payments = await Payment.find(filter)
      .populate('student', 'name studentId phone')
      .populate('branch', 'name')
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 });

    let totalCollected = 0;
    let cashTotal = 0;
    let bankTotal = 0;
    let onlineTotal = 0;

    payments.forEach(p => {
      const amt = Number(p.paidAmount) || 0;
      totalCollected += amt;
      if (p.paymentMethod === 'Cash') cashTotal += amt;
      else if (p.paymentMethod === 'Bank Transfer') bankTotal += amt;
      else onlineTotal += amt;
    });

    res.json({
      success: true,
      summary: {
        period: `${startOfMonth.toLocaleString('default', { month: 'long' })} ${targetYear}`,
        totalTransactions: payments.length,
        totalCollected,
        cashTotal,
        bankTotal,
        onlineTotal
      },
      data: payments.map(p => ({
        receiptNumber: p.receiptNumber,
        date: formatDate(p.paymentDate),
        studentId: p.student ? p.student.studentId : '',
        studentName: p.student ? p.student.name : 'Unknown',
        branchName: p.branch ? p.branch.name : '',
        paidAmount: p.paidAmount,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference || '',
        receivedBy: p.receivedBy ? p.receivedBy.name : ''
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Pending fees report
// @route   GET /api/reports/pending-fees
// @access  Private
async function getPendingFeeReport(req, res) {
  try {
    const memberships = await StudentMembership.find({
      status: { $in: ['active', 'expiring_soon'] },
      balanceDue: { $gt: 0 }
    }).populate('student', 'name studentId phone email branch batch');

    let totalPending = 0;
    memberships.forEach(m => {
      totalPending += Number(m.balanceDue) || 0;
    });

    res.json({
      success: true,
      summary: {
        totalPendingStudents: memberships.length,
        totalPendingAmount: totalPending
      },
      data: memberships.map(m => ({
        studentId: m.student ? m.student.studentId : '',
        studentName: m.student ? m.student.name : 'Unknown',
        phone: m.student ? m.student.phone : '',
        packageName: m.packageName,
        packageAmount: m.packageAmount,
        totalPaid: m.totalPaid,
        balanceDue: m.balanceDue,
        expiryDate: formatDate(m.expiryDate),
        status: m.status
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Expired memberships report
// @route   GET /api/reports/expired-memberships
// @access  Private
async function getExpiredMembershipsReport(req, res) {
  try {
    const expired = await StudentMembership.find({ status: 'expired' })
      .populate('student', 'name studentId phone email branch')
      .sort({ expiryDate: -1 });

    res.json({
      success: true,
      count: expired.length,
      data: expired.map(m => ({
        studentId: m.student ? m.student.studentId : '',
        studentName: m.student ? m.student.name : 'Unknown',
        phone: m.student ? m.student.phone : '',
        packageName: m.packageName,
        expiryDate: formatDate(m.expiryDate),
        attendedClasses: m.attendedClasses,
        classLimit: m.classLimit || 'Unlimited',
        balanceDue: m.balanceDue
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Branch-wise performance report
// @route   GET /api/reports/branch-performance
// @access  Private
async function getBranchPerformanceReport(req, res) {
  try {
    const branches = await Branch.find();
    const allStudents = await Student.find();
    const allPayments = await Payment.find();

    const report = branches.map(b => {
      const bStudents = allStudents.filter(s => String(s.branch) === String(b._id));
      const activeCount = bStudents.filter(s => s.status === 'active').length;
      const bPayments = allPayments.filter(p => String(p.branch) === String(b._id));
      const totalRevenue = bPayments.reduce((acc, p) => acc + (Number(p.paidAmount) || 0), 0);

      return {
        branchId: b._id,
        branchName: b.name,
        code: b.code,
        phone: b.phone,
        totalStudents: bStudents.length,
        activeStudents: activeCount,
        totalRevenue
      };
    });

    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDailyAttendanceReport,
  getMonthlyFeeReport,
  getPendingFeeReport,
  getExpiredMembershipsReport,
  getBranchPerformanceReport
};

