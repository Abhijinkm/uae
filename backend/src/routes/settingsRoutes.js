const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getInstructors,
  createInstructor,
  updateInstructor,
  getAuditLogs,
  getStaffUsers
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getSettings);
router.put('/', protect, authorize('admin'), updateSettings);

router.get('/branches', getBranches);
router.post('/branches', protect, authorize('admin'), createBranch);
router.put('/branches/:id', protect, authorize('admin'), updateBranch);
router.delete('/branches/:id', protect, authorize('admin'), deleteBranch);

router.get('/batches', getBatches);
router.post('/batches', protect, authorize('admin'), createBatch);
router.put('/batches/:id', protect, authorize('admin'), updateBatch);
router.delete('/batches/:id', protect, authorize('admin'), deleteBatch);

router.get('/instructors', getInstructors);
router.post('/instructors', protect, authorize('admin'), createInstructor);
router.put('/instructors/:id', protect, authorize('admin'), updateInstructor);

router.get('/audit-logs', protect, authorize('admin'), getAuditLogs);
router.get('/staff', protect, authorize('admin'), getStaffUsers);

module.exports = router;
