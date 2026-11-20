const express = require('express');
const router = express.Router();
const {
  getUpcomingRenewals,
  sendManualReminder,
  triggerDailyReminderSweep,
  getReminderLogs
} = require('../controllers/reminderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/upcoming', protect, getUpcomingRenewals);
router.post('/send', protect, sendManualReminder);
router.post('/run-cron', protect, authorize('admin'), triggerDailyReminderSweep);
router.get('/logs', protect, getReminderLogs);

module.exports = router;

