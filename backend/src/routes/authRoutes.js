const express = require('express');
const router = express.Router();
const { login, getMe, registerStaff } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/register-staff', protect, authorize('admin'), registerStaff);

module.exports = router;

