const express = require('express');
const router = express.Router();
const {
  getDailyAttendance,
  markAttendance,
  getStudentAttendanceHistory
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDailyAttendance);
router.post('/mark', protect, markAttendance);
router.get('/student/:id', protect, getStudentAttendanceHistory);

module.exports = router;

