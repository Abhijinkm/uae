const express = require('express');
const router = express.Router();
const {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  previewDateCalculation,
  renewMembership
} = require('../controllers/membershipController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/packages', getPackages);
router.post('/packages', protect, authorize('admin'), createPackage);
router.put('/packages/:id', protect, authorize('admin'), updatePackage);
router.delete('/packages/:id', protect, authorize('admin'), deletePackage);

router.post('/calculate-dates', protect, previewDateCalculation);
router.post('/renew', protect, renewMembership);

module.exports = router;

