const express = require('express');
const router = express.Router();
const {
  getDailyAttendanceReport,
  getMonthlyFeeReport,
  getPendingFeeReport,
  getExpiredMembershipsReport,
  getBranchPerformanceReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/daily-attendance', protect, getDailyAttendanceReport);
router.get('/monthly-fees', protect, getMonthlyFeeReport);
router.get('/pending-fees', protect, getPendingFeeReport);
router.get('/expired-memberships', protect, getExpiredMembershipsReport);
router.get('/branch-performance', protect, getBranchPerformanceReport);

module.exports = router;

