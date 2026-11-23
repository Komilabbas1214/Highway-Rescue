const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Mechanic = require('../models/Mechanic');
const {
  isRazorpayConfigured,
  getRazorpayInstance,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} = require('../config/razorpay');
const {
  notifyCustomer,
  notifyMechanic,
  notifyBookingRoom,
  notifyAdmin,
} = require('../services/socketService');

// @desc    Create Razorpay Order for booking payment
// @route   POST /api/payments/create-order
// @access  Private (Customer)
const createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid booking ID.',
      });
    }

    const booking = await Booking.findById(bookingId).populate('customer', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Ownership check: only customer who owns the booking or admin can initiate payment
    const isOwner = booking.customer && (booking.customer._id || booking.customer).toString() === req.user._id.toString();
    if (req.user.role === 'customer' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only initiate payment for your own bookings.',
      });
    }

    if (booking.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid.',
      });
    }

    // Amount strictly calculated on backend from server booking data (in Rupees)
    const payableRupees = booking.finalCost || booking.estimatedCost || 400;
    const amountInPaise = Math.round(payableRupees * 100);
    const currency = 'INR';
    const receipt = `rcpt_${booking.bookingId}_${Date.now()}`;

    // Calculate planned 10% platform commission & 90% mechanic payout
    const commissionRate = 0.10;
    const commissionAmount = Math.round(payableRupees * commissionRate * 100) / 100;
    const mechanicPayout = Math.round((payableRupees - commissionAmount) * 100) / 100;

    // Check if valid Razorpay test or live credentials are configured
    if (isRazorpayConfigured()) {
      try {
        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency,
          receipt,
          notes: {
            bookingId: booking._id.toString(),
            bookingNumber: booking.bookingId,
            customerName: req.user.name,
            customerEmail: req.user.email || '',
            customerPhone: req.user.phone || '',
          },
        });

        return res.status(200).json({
          success: true,
          isSimulation: false,
          keyId: process.env.RAZORPAY_KEY_ID,
          order: {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
          },
          bookingDetails: {
            id: booking._id,
            bookingNumber: booking.bookingId,
            serviceType: booking.serviceType,
            amount: payableRupees,
            commission: {
              rate: commissionRate,
              commissionAmount,
              mechanicPayout,
            },
          },
        });
      } catch (rzpErr) {
        console.error('[Razorpay Order Creation Error]:', rzpErr.message);
        return res.status(502).json({
          success: false,
          message: 'Unable to initialize Razorpay checkout order. Please try again or choose cash on handover.',
        });
      }
    } else {
      // In development/test mode without live keys:
      // Return a simulation order and keyId: null to prevent checkout.js from making
      // unauthenticated requests to api.razorpay.com that trigger Chrome's HTTP Basic Auth prompt.
      const mockOrderId = `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      return res.status(200).json({
        success: true,
        isSimulation: true,
        keyId: null,
        order: {
          id: mockOrderId,
          amount: amountInPaise,
          currency,
          receipt,
          status: 'created',
        },
        message: 'Razorpay test simulation mode active. Live keys not configured.',
        bookingDetails: {
          id: booking._id,
          bookingNumber: booking.bookingId,
          serviceType: booking.serviceType,
          amount: payableRupees,
          commission: {
            rate: commissionRate,
            commissionAmount,
            mechanicPayout,
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment signature & update booking
// @route   POST /api/payments/verify
// @access  Private (Customer)
const verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required.',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Ownership check
    const isOwner = booking.customer.toString() === req.user._id.toString();
    if (req.user.role === 'customer' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only pay for your own booking.',
      });
    }

    if (booking.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid.',
      });
    }

    // Verify cryptographic signature if real Razorpay order ID is provided
    let isAuthentic = true;
    const isSimulationOrder = !razorpay_order_id || razorpay_order_id.startsWith('order_test_');

    if (!isSimulationOrder) {
      isAuthentic = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
    }

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid transaction signature.',
      });
    }

    // Calculate amount and 10% platform commission breakdown
    const amount = booking.finalCost || booking.estimatedCost || 400;
    const commissionRate = 0.10;
    const commissionAmount = Math.round(amount * commissionRate * 100) / 100;
    const mechanicPayout = Math.round((amount - commissionAmount) * 100) / 100;

    // Create payment record in database
    const payment = await Payment.create({
      booking: booking._id,
      customer: booking.customer,
      mechanic: booking.mechanic,
      amount,
      currency: 'INR',
      paymentMethod: 'Razorpay',
      razorpayOrderId: razorpay_order_id || '',
      razorpayPaymentId: razorpay_payment_id || `pay_sim_${Date.now()}`,
      razorpaySignature: razorpay_signature || '',
      status: 'Captured',
      commissionRate,
      commissionAmount,
      mechanicPayout,
      notes: `Online payment completed via Razorpay. Order: ${razorpay_order_id || 'simulated'}`,
    });

    // Update booking record
    booking.paymentMethod = 'Online';
    booking.paymentStatus = 'Paid';
    booking.paymentId = payment._id;
    booking.statusTimeline.push({
      status: booking.status,
      timestamp: new Date(),
      note: `Online payment of ₹${amount} completed via Razorpay (Txn ID: ${payment.razorpayPaymentId}). Platform commission (10%): ₹${commissionAmount}, Mechanic payout: ₹${mechanicPayout}.`,
    });
    await booking.save();

    // Real-time Socket.IO notifications
    notifyCustomer(booking.customer.toString(), 'bookingStatusUpdated', {
      bookingId: booking._id,
      paymentStatus: 'Paid',
      paymentMethod: 'Online',
    });
    notifyCustomer(booking.customer.toString(), 'paymentCompleted', {
      bookingId: booking._id,
      amount,
      paymentMethod: 'Online',
      paymentId: payment._id,
    });

    if (booking.mechanic) {
      notifyMechanic(booking.mechanic.toString(), 'paymentCompleted', {
        bookingId: booking._id,
        amount,
        mechanicPayout,
        paymentMethod: 'Online',
      });
    }

    notifyBookingRoom(booking._id.toString(), 'paymentCompleted', {
      bookingId: booking._id,
      paymentStatus: 'Paid',
      amount,
    });

    notifyAdmin('paymentCompleted', {
      bookingId: booking._id,
      amount,
      commissionAmount,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and completed successfully!',
      payment,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record failed payment attempt
// @route   POST /api/payments/failed
// @access  Private (Customer)
const recordPaymentFailure = async (req, res, next) => {
  try {
    const { bookingId, orderId, error: paymentError } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const amount = booking.finalCost || booking.estimatedCost || 400;
    const reason = paymentError?.description || paymentError?.reason || 'Payment declined or cancelled.';

    const failedPayment = await Payment.create({
      booking: booking._id,
      customer: req.user._id,
      mechanic: booking.mechanic,
      amount,
      currency: 'INR',
      paymentMethod: 'Razorpay',
      razorpayOrderId: orderId || '',
      status: 'Failed',
      errorMessage: reason,
      notes: `Failed attempt: ${reason}`,
    });

    booking.statusTimeline.push({
      status: booking.status,
      timestamp: new Date(),
      note: `Online payment attempt failed: ${reason}`,
    });
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded.',
      payment: failedPayment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete payment using Cash On Delivery / Handover
// @route   POST /api/payments/cash
// @access  Private
const markCashPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required.',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid.',
      });
    }

    const amount = booking.finalCost || booking.estimatedCost || 400;
    const commissionRate = 0.10;
    const commissionAmount = Math.round(amount * commissionRate * 100) / 100;
    const mechanicPayout = Math.round((amount - commissionAmount) * 100) / 100;

    const payment = await Payment.create({
      booking: booking._id,
      customer: booking.customer,
      mechanic: booking.mechanic,
      amount,
      currency: 'INR',
      paymentMethod: 'Cash',
      status: 'Captured',
      commissionRate,
      commissionAmount,
      mechanicPayout,
      notes: 'Direct cash payment handed to mechanic upon service completion.',
    });

    booking.paymentMethod = 'Cash';
    booking.paymentStatus = 'Paid';
    booking.paymentId = payment._id;
    booking.statusTimeline.push({
      status: booking.status,
      timestamp: new Date(),
      note: `Cash payment of ₹${amount} received directly by mechanic. Platform commission (10%): ₹${commissionAmount}, Mechanic payout: ₹${mechanicPayout}.`,
    });
    await booking.save();

    // Socket.IO notifications
    notifyCustomer(booking.customer.toString(), 'bookingStatusUpdated', {
      bookingId: booking._id,
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
    });
    notifyCustomer(booking.customer.toString(), 'paymentCompleted', {
      bookingId: booking._id,
      amount,
      paymentMethod: 'Cash',
      paymentId: payment._id,
    });

    if (booking.mechanic) {
      notifyMechanic(booking.mechanic.toString(), 'paymentCompleted', {
        bookingId: booking._id,
        amount,
        mechanicPayout,
        paymentMethod: 'Cash',
      });
    }

    notifyBookingRoom(booking._id.toString(), 'paymentCompleted', {
      bookingId: booking._id,
      paymentStatus: 'Paid',
      amount,
    });

    notifyAdmin('paymentCompleted', {
      bookingId: booking._id,
      amount,
      commissionAmount,
    });

    res.status(200).json({
      success: true,
      message: 'Cash payment logged successfully!',
      payment,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public (Signature-verified)
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && !verifyRazorpayWebhookSignature(req.body, signature, webhookSecret)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature.',
      });
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured' && payload?.payment?.entity) {
      const paymentEntity = payload.payment.entity;
      const bookingId = paymentEntity.notes?.bookingId;

      if (bookingId) {
        const booking = await Booking.findById(bookingId);
        if (booking && booking.paymentStatus !== 'Paid') {
          const amount = paymentEntity.amount / 100;
          const commissionRate = 0.10;
          const commissionAmount = Math.round(amount * commissionRate * 100) / 100;
          const mechanicPayout = Math.round((amount - commissionAmount) * 100) / 100;

          const payment = await Payment.create({
            booking: booking._id,
            customer: booking.customer,
            mechanic: booking.mechanic,
            amount,
            currency: paymentEntity.currency || 'INR',
            paymentMethod: 'Razorpay',
            razorpayOrderId: paymentEntity.order_id,
            razorpayPaymentId: paymentEntity.id,
            status: 'Captured',
            commissionRate,
            commissionAmount,
            mechanicPayout,
            notes: 'Verified via Razorpay payment.captured webhook.',
          });

          booking.paymentMethod = 'Online';
          booking.paymentStatus = 'Paid';
          booking.paymentId = payment._id;
          booking.statusTimeline.push({
            status: booking.status,
            timestamp: new Date(),
            note: `Payment of ₹${amount} captured via Razorpay webhook. Txn ID: ${paymentEntity.id}.`,
          });
          await booking.save();

          notifyCustomer(booking.customer.toString(), 'paymentCompleted', {
            bookingId: booking._id,
            amount,
            paymentMethod: 'Online',
          });
        }
      }
    } else if (event === 'payment.failed' && payload?.payment?.entity) {
      const paymentEntity = payload.payment.entity;
      const bookingId = paymentEntity.notes?.bookingId;

      if (bookingId) {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          booking.statusTimeline.push({
            status: booking.status,
            timestamp: new Date(),
            note: `Razorpay webhook: Payment failed (${paymentEntity.error_description || 'Declined'}).`,
          });
          await booking.save();
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's payment transaction history
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'mechanic') {
      const mechanic = await Mechanic.findOne({ user: req.user._id });
      if (mechanic) {
        query.mechanic = mechanic._id;
      }
    }

    const payments = await Payment.find(query)
      .populate('booking', 'bookingId serviceType vehicleNumber')
      .populate('customer', 'name phone email')
      .populate('mechanic', 'name shopName phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  recordPaymentFailure,
  markCashPayment,
  handleWebhook,
  getPaymentHistory,
};
