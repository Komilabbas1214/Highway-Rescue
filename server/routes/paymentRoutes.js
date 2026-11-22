const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  markCashPayment,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/cash', markCashPayment);
router.get('/history', getPaymentHistory);

module.exports = router;
