const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  recordPaymentFailure,
  markCashPayment,
  handleWebhook,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public Webhook endpoint - verified cryptographically via X-Razorpay-Signature
router.post('/webhook', handleWebhook);

// Protected routes (Customer / Mechanic / Admin)
router.use(protect);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/failed', recordPaymentFailure);
router.post('/cash', markCashPayment);
router.get('/history', getPaymentHistory);

module.exports = router;
