const express = require('express');
const router = express.Router();
const {
  recordPayment,
  getPayments,
  getPaymentReceipt
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, recordPayment);
router.get('/', protect, getPayments);
router.get('/:id/receipt', protect, getPaymentReceipt);

module.exports = router;

