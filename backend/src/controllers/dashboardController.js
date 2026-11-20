const { Student, StudentMembership, Attendance, Payment } = require('../models');
const { getUpcomingRenewalsList } = require('../services/reminderService');
const { formatDate } = require('../utils/dateUtils');

// @desc    Get complete admin dashboard stats and chart data
// @route   GET /api/dashboard/stats
// @access  Private (Admin / Staff)
async function getDashboardStats(req, res) {
  try {
    const todayStr = formatDate(new Date());

    // 1. Student Counts
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'active' });
    const inactiveStudents = await Student.countDocuments({ status: { $in: ['inactive', 'suspended'] } });

    // 2. Today's Attendance
    const todayAttendances = await Attendance.find({ date: todayStr }).populate('student', 'name studentId phone photo');
    const todayPresent = todayAttendances.filter(a => a.status === 'Present').length;
    const todayAbsent = todayAttendances.filter(a => a.status === 'Absent').length;
    const todayLeave = todayAttendances.filter(a => a.status === 'Leave').length;

    // 3. Memberships & Expiries
    const expiredMemberships = await StudentMembership.countDocuments({ status: 'expired' });
    const expiringSoonMemberships = await StudentMembership.countDocuments({ status: 'expiring_soon' });

    // 4. Financials (This Month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const allPayments = await Payment.find();
    let feesCollectedThisMonth = 0;
    let totalAllTimeRevenue = 0;

    for (const p of allPayments) {
      const pDate = new Date(p.paymentDate);
      const paid = Number(p.paidAmount) || 0;
      totalAllTimeRevenue += paid;
      if (pDate >= startOfMonth && pDate <= endOfMonth) {
        feesCollectedThisMonth += paid;
      }
    }

    // Pending fees: sum of balanceDue across active/expiring memberships
    const activeMemberships = await StudentMembership.find({
      status: { $in: ['active', 'expiring_soon'] }
    });
    let pendingFees = 0;
    for (const mem of activeMemberships) {
      pendingFees += Number(mem.balanceDue) || 0;
    }

    // 5. Attendance Trend (Last 7 Days)
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = formatDate(d);
      const dayRecords = await Attendance.find({ date: dayStr });
      attendanceTrend.push({
        date: dayStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        present: dayRecords.filter(r => r.status === 'Present').length,
        absent: dayRecords.filter(r => r.status === 'Absent').length,
        leave: dayRecords.filter(r => r.status === 'Leave').length
      });
    }

    // 6. Monthly Revenue Trend (Last 6 Months)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = mStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      let sum = 0;
      for (const p of allPayments) {
        const pDate = new Date(p.paymentDate);
        if (pDate >= mStart && pDate <= mEnd) {
          sum += Number(p.paidAmount) || 0;
        }
      }
      revenueTrend.push({
        month: monthLabel,
        revenue: sum
      });
    }

    // 7. Membership Package Distribution
    const packageCounts = {};
    for (const mem of activeMemberships) {
      const name = mem.packageName || 'Unknown';
      packageCounts[name] = (packageCounts[name] || 0) + 1;
    }
    const packageDistribution = Object.keys(packageCounts).map(name => ({
      name,
      count: packageCounts[name]
    }));

    // 8. Upcoming Renewals (Top 5 urgent)
    const upcomingRenewals = await getUpcomingRenewalsList();

    res.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        todayAttendance: {
          present: todayPresent,
          absent: todayAbsent,
          leave: todayLeave,
          totalMarked: todayAttendances.length
        },
        feesCollectedThisMonth,
        totalAllTimeRevenue,
        pendingFees,
        expiredMemberships,
        upcomingRenewalsCount: upcomingRenewals.length
      },
      charts: {
        attendanceTrend,
        revenueTrend,
        packageDistribution
      },
      upcomingRenewals: upcomingRenewals.slice(0, 6),
      todayRecords: todayAttendances.slice(0, 8)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDashboardStats
};

