const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const CommissionSettlement = require('../models/CommissionSettlement');
const { notifyMechanic, notifyCustomer } = require('../services/socketService');

// @desc    Admin dashboard metrics summary
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalMechanics = await Mechanic.countDocuments();
    const verifiedMechanics = await Mechanic.countDocuments({
      $or: [{ approvalStatus: 'Approved' }, { isVerified: true }],
    });
    const pendingMechanics = await Mechanic.countDocuments({
      $or: [
        { approvalStatus: 'Pending' },
        { isVerified: false, approvalStatus: { $nin: ['Rejected', 'Suspended'] } },
      ],
    });
    const rejectedMechanics = await Mechanic.countDocuments({ approvalStatus: 'Rejected' });
    const suspendedMechanics = await Mechanic.countDocuments({ approvalStatus: 'Suspended' });

    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'Pending' });
    const activeBookings = await Booking.countDocuments({
      status: { $in: ['Accepted', 'On The Way', 'Arrived', 'In Progress'] },
    });
    const completedBookings = await Booking.countDocuments({ status: 'Completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'Cancelled' });

    // Calculate total payments revenue
    const payments = await Payment.find({ status: 'Captured' });
    const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Recent 10 bookings
    const recentBookings = await Booking.find()
      .populate('customer', 'name phone email vehicleNumber')
      .populate('mechanic', 'name shopName phone')
      .sort('-createdAt')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalMechanics,
        verifiedMechanics,
        pendingMechanics,
        rejectedMechanics,
        suspendedMechanics,
        totalBookings,
        pendingBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered customers
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    } else {
      query.role = 'customer';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle block/unblock customer or user
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot block administrator accounts.',
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} is now ${user.isBlocked ? 'BLOCKED' : 'UNBLOCKED'}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all mechanics with filters
// @route   GET /api/admin/mechanics
// @access  Private (Admin)
const getAllMechanics = async (req, res, next) => {
  try {
    const { verified, search, approvalStatus } = req.query;
    const query = {};

    if (approvalStatus && approvalStatus !== 'All') {
      query.approvalStatus = approvalStatus;
    } else if (verified !== undefined && verified !== '') {
      query.isVerified = verified === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shopName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { serviceArea: { $regex: search, $options: 'i' } },
      ];
    }

    const mechanics = await Mechanic.find(query)
      .populate('user', 'email isBlocked createdAt')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: mechanics.length,
      data: mechanics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a pending mechanic application
// @route   PUT /api/admin/mechanics/:id/approve
// @access  Private (Admin)
const approveMechanic = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic profile not found',
      });
    }

    mechanic.approvalStatus = 'Approved';
    mechanic.isVerified = true;
    mechanic.isActive = true;
    mechanic.verifiedAt = new Date();
    mechanic.verifiedBy = req.user._id;
    mechanic.rejectionReason = '';
    mechanic.suspensionReason = '';
    if (req.body.verificationNotes) {
      mechanic.verificationNotes = req.body.verificationNotes;
    }

    await mechanic.save();

    // Socket events
    notifyMechanic(mechanic._id.toString(), 'mechanicApproved', {
      mechanicId: mechanic._id.toString(),
      approvalStatus: 'Approved',
      isVerified: true,
      message: 'Congratulations! Your mechanic account has been verified and approved by admin. You can now toggle online to accept service requests.',
    });
    notifyMechanic(mechanic._id.toString(), 'mechanicStatusChanged', {
      mechanicId: mechanic._id.toString(),
      approvalStatus: 'Approved',
      isVerified: true,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: `Mechanic ${mechanic.name} (${mechanic.shopName}) has been approved and verified.`,
      mechanic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a mechanic application with reason
// @route   PUT /api/admin/mechanics/:id/reject
// @access  Private (Admin)
const rejectMechanic = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic profile not found',
      });
    }

    const rejectionReason = reason && reason.trim() ? reason.trim() : 'Application details or identity proof requirements not met.';

    mechanic.approvalStatus = 'Rejected';
    mechanic.isVerified = false;
    mechanic.isOnline = false;
    mechanic.rejectionReason = rejectionReason;

    await mechanic.save();

    // Socket events
    notifyMechanic(mechanic._id.toString(), 'mechanicRejected', {
      mechanicId: mechanic._id.toString(),
      approvalStatus: 'Rejected',
      reason: rejectionReason,
      message: `Your mechanic application was rejected: ${rejectionReason}`,
    });
    notifyMechanic(mechanic._id.toString(), 'mechanicStatusChanged', {
      mechanicId: mechanic._id.toString(),
      approvalStatus: 'Rejected',
      isVerified: false,
      isOnline: false,
      rejectionReason,
    });

    res.status(200).json({
      success: true,
      message: `Mechanic ${mechanic.name} (${mechanic.shopName}) application rejected.`,
      mechanic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend an approved mechanic with reason
// @route   PUT /api/admin/mechanics/:id/suspend
// @access  Private (Admin)
const suspendMechanic = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic profile not found',
      });
    }

    const suspensionReason = reason && reason.trim() ? reason.trim() : 'Account suspended due to policy violation or customer complaints.';

    mechanic.approvalStatus = 'Suspended';
    mechanic.isActive = false;
    mechanic.isOnline = false;
    mechanic.suspensionReason = suspensionReason;

    await mechanic.save();

    // Socket events
    notifyMechanic(mechanic._id.toString(), 'mechanicSuspended', {
      mechanicId: mechanic._id.toString(),
      approvalStatus: 'Suspended',
      reason: suspensionReason,
      message: `Your mechanic account has been suspended: ${suspensionReason}`,
    });
    notifyMechanic(mechanic._id.toString(), 'mechanicStatusChanged', {
      mechanicId: mechanic._id.toString(),
      approvalStatus: 'Suspended',
      isActive: false,
      isOnline: false,
      suspensionReason,
    });

    res.status(200).json({
      success: true,
      message: `Mechanic ${mechanic.name} (${mechanic.shopName}) has been suspended.`,
      mechanic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reactivate a suspended mechanic
// @route   PUT /api/admin/mechanics/:id/reactivate
// @access  Private (Admin)
const reactivateMechanic = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic profile not found',
      });
    }

    mechanic.approvalStatus = 'Approved';
    mechanic.isActive = true;
    mechanic.isVerified = true;
    mechanic.suspensionReason = '';

    await mechanic.save();

    // Socket events
    notifyMechanic(mechanic._id.toString(), 'mechanicReactivated', {
      mechanicId: mechanic._id.toString(),
      approvalStatus: 'Approved',
      message: 'Your account has been reactivated. You can now toggle online to accept service requests.',
    });
    notifyMechanic(mechanic._id.toString(), 'mechanicStatusChanged', {
      mechanicId: mechanic._id.toString(),
      approvalStatus: 'Approved',
      isActive: true,
      isVerified: true,
    });

    res.status(200).json({
      success: true,
      message: `Mechanic ${mechanic.name} (${mechanic.shopName}) has been reactivated.`,
      mechanic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or reject mechanic application (legacy support)
// @route   PUT /api/admin/mechanics/:id/verify
// @access  Private (Admin)
const verifyMechanic = async (req, res, next) => {
  try {
    const { isVerified, verificationNotes } = req.body;
    const mechanic = await Mechanic.findById(req.params.id);

    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic profile not found',
      });
    }

    mechanic.isVerified = isVerified;
    mechanic.approvalStatus = isVerified ? 'Approved' : 'Rejected';
    if (!isVerified) {
      mechanic.isOnline = false;
    } else {
      mechanic.isActive = true;
    }
    mechanic.verifiedAt = isVerified ? new Date() : null;
    mechanic.verifiedBy = isVerified ? req.user._id : null;
    if (verificationNotes !== undefined) {
      mechanic.verificationNotes = verificationNotes;
    }

    await mechanic.save();

    // Notify mechanic via Socket
    notifyMechanic(mechanic._id.toString(), 'verificationStatusUpdated', {
      isVerified: mechanic.isVerified,
      approvalStatus: mechanic.approvalStatus,
      message: isVerified
        ? 'Congratulations! Your mechanic account has been verified by the admin. You are now eligible to accept service requests.'
        : 'Your verification status has been updated.',
    });
    notifyMechanic(mechanic._id.toString(), 'mechanicStatusChanged', {
      mechanicId: mechanic._id.toString(),
      approvalStatus: mechanic.approvalStatus,
      isVerified: mechanic.isVerified,
    });

    res.status(200).json({
      success: true,
      message: `Mechanic ${mechanic.shopName} has been ${isVerified ? 'VERIFIED' : 'UNVERIFIED'}.`,
      mechanic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle mechanic active / inactive status
// @route   PUT /api/admin/mechanics/:id/toggle-active
// @access  Private (Admin)
const toggleMechanicActive = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic not found',
      });
    }

    mechanic.isActive = !mechanic.isActive;
    if (!mechanic.isActive) {
      mechanic.isOnline = false;
    }
    await mechanic.save();

    res.status(200).json({
      success: true,
      message: `Mechanic ${mechanic.shopName} is now ${mechanic.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
      mechanic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings with status filter
// @route   GET /api/admin/bookings
// @access  Private (Admin)
const getAllBookings = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { serviceType: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name phone email')
      .populate('mechanic', 'name shopName phone isVerified')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/admin/reviews
// @access  Private (Admin)
const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('customer', 'name email phone')
      .populate('mechanic', 'name shopName phone')
      .populate('booking', 'bookingId serviceType')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / delete inappropriate review
// @route   DELETE /api/admin/reviews/:id
// @access  Private (Admin)
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed platform commission & settlement analytics
// @route   GET /api/admin/earnings
// @access  Private (Admin)
const getAdminEarnings = async (req, res, next) => {
  try {
    const { timeRange, startDate, endDate, mechanicId } = req.query;

    const query = {
      status: 'Completed',
      paymentStatus: 'Paid',
    };

    if (mechanicId) {
      query.mechanic = mechanicId;
    }

    // Time range filter
    if (timeRange === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfDay };
    } else if (timeRange === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.createdAt = { $gte: sevenDaysAgo };
    } else if (timeRange === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    } else if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Completed & paid bookings
    const bookings = await Booking.find(query)
      .populate('customer', 'name phone email vehicleNumber')
      .populate('mechanic', 'name shopName phone rating location')
      .sort('-createdAt');

    // Metrics calculations
    const totalCompletedBookings = bookings.length;
    let grossBookingValue = 0;
    let totalPlatformCommission = 0;
    let commissionCollected = 0;
    let outstandingCommission = 0;
    let mechanicPayoutsDue = 0;

    bookings.forEach((b) => {
      const gross = b.finalCost || b.estimatedCost || 400;
      grossBookingValue += gross;

      // Platform commission 10%
      const commRate = b.commissionRate || 0.10;
      const platformComm = b.platformCommission > 0
        ? b.platformCommission
        : Math.round(gross * commRate * 100) / 100;
      const mechEarning = b.mechanicEarning > 0
        ? b.mechanicEarning
        : Math.round((gross - platformComm) * 100) / 100;

      totalPlatformCommission += platformComm;

      if (b.paymentMethod === 'Online') {
        // Platform already collected full payment from Razorpay
        commissionCollected += platformComm;
        if (b.settlementStatus === 'Pending') {
          mechanicPayoutsDue += mechEarning;
        }
      } else {
        // Cash payment: Customer handed cash to mechanic
        if (b.settlementStatus === 'Settled') {
          commissionCollected += platformComm;
        } else {
          // Mechanic holds cash, owes 10% platform commission
          outstandingCommission += platformComm;
        }
      }
    });

    // Mechanic-wise aggregated report
    const allMechanics = await Mechanic.find({ isVerified: true });
    const mechanicReports = allMechanics.map((m) => {
      const mechBookings = bookings.filter(
        (b) => b.mechanic && b.mechanic._id.toString() === m._id.toString()
      );

      let mGross = 0;
      let mCommission = 0;
      let mEarning = 0;
      let mCashCollected = 0;
      let mOnlineEarning = 0;
      let mCashCommissionOwed = 0;
      let mOnlinePayoutPending = 0;
      const pendingBookingIds = [];

      mechBookings.forEach((b) => {
        const gross = b.finalCost || b.estimatedCost || 400;
        mGross += gross;
        const comm = b.platformCommission > 0
          ? b.platformCommission
          : Math.round(gross * (b.commissionRate || 0.10) * 100) / 100;
        const earn = b.mechanicEarning > 0
          ? b.mechanicEarning
          : Math.round((gross - comm) * 100) / 100;

        mCommission += comm;
        mEarning += earn;

        if (b.paymentMethod === 'Cash') {
          mCashCollected += gross;
          if (b.settlementStatus === 'Pending') {
            mCashCommissionOwed += comm;
            pendingBookingIds.push(b._id);
          }
        } else {
          mOnlineEarning += earn;
          if (b.settlementStatus === 'Pending') {
            mOnlinePayoutPending += earn;
            pendingBookingIds.push(b._id);
          }
        }
      });

      // Net balance: positive means platform owes mechanic, negative means mechanic owes platform
      const netBalance = Math.round((mOnlinePayoutPending - mCashCommissionOwed) * 100) / 100;

      return {
        mechanicId: m._id,
        name: m.name,
        shopName: m.shopName,
        phone: m.phone,
        totalJobs: mechBookings.length,
        grossRevenue: Math.round(mGross * 100) / 100,
        platformCommission: Math.round(mCommission * 100) / 100,
        mechanicEarnings: Math.round(mEarning * 100) / 100,
        cashCollected: Math.round(mCashCollected * 100) / 100,
        cashCommissionOwed: Math.round(mCashCommissionOwed * 100) / 100,
        onlinePayoutPending: Math.round(mOnlinePayoutPending * 100) / 100,
        netBalance,
        pendingBookingIds,
      };
    });

    // Recent settlements ledger
    const settlementHistory = await CommissionSettlement.find()
      .populate('mechanic', 'name shopName phone')
      .populate('processedBy', 'name email')
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCompletedBookings,
          grossBookingValue: Math.round(grossBookingValue * 100) / 100,
          totalPlatformCommission: Math.round(totalPlatformCommission * 100) / 100,
          commissionCollected: Math.round(commissionCollected * 100) / 100,
          outstandingCommission: Math.round(outstandingCommission * 100) / 100,
          mechanicPayoutsDue: Math.round(mechanicPayoutsDue * 100) / 100,
        },
        mechanicReports: mechanicReports.filter((r) => r.totalJobs > 0 || r.netBalance !== 0),
        settlementHistory,
        recentBookings: bookings.slice(0, 20),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reconciles cash commission collected from mechanic
// @route   POST /api/admin/settlements/reconcile-cash
// @access  Private (Admin)
const reconcileCashCommission = async (req, res, next) => {
  try {
    const { mechanicId, bookingIds, referenceNumber, paymentMethod, notes } = req.body;

    if (!mechanicId) {
      return res.status(400).json({
        success: false,
        message: 'Mechanic ID is required.',
      });
    }

    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic not found.',
      });
    }

    // Find pending cash bookings for this mechanic
    const bookingQuery = {
      mechanic: mechanicId,
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      settlementStatus: 'Pending',
    };

    if (Array.isArray(bookingIds) && bookingIds.length > 0) {
      bookingQuery._id = { $in: bookingIds };
    }

    const bookingsToReconcile = await Booking.find(bookingQuery);

    if (bookingsToReconcile.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending cash bookings found to reconcile.',
      });
    }

    const refNo = referenceNumber || `CASH-REC-${Date.now()}`;
    let totalReconciledCommission = 0;
    const reconciledBookingIds = [];

    for (const b of bookingsToReconcile) {
      const comm = b.platformCommission > 0
        ? b.platformCommission
        : Math.round((b.finalCost || b.estimatedCost || 400) * 0.10 * 100) / 100;
      totalReconciledCommission += comm;
      reconciledBookingIds.push(b._id);

      b.settlementStatus = 'Settled';
      b.settlementReference = refNo;
      b.settledAt = new Date();
      b.settlementNotes = notes || 'Cash commission reconciled by admin';
      await b.save();

      // Update associated payment record
      await Payment.updateMany(
        { booking: b._id },
        {
          $set: {
            settlementStatus: 'Settled',
            settlementReference: refNo,
            settledAt: new Date(),
          },
        }
      );
    }

    // Create Settlement ledger entry
    const settlementRecord = await CommissionSettlement.create({
      settlementId: `STL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      mechanic: mechanic._id,
      settlementType: 'Cash_Commission_Reconciliation',
      bookings: reconciledBookingIds,
      amount: Math.round(totalReconciledCommission * 100) / 100,
      amountPaise: Math.round(totalReconciledCommission * 100),
      paymentMethod: paymentMethod || 'Cash_Reconciled',
      referenceNumber: refNo,
      status: 'Completed',
      processedBy: req.user._id,
      notes: notes || `Reconciled ${bookingsToReconcile.length} cash commission bookings.`,
    });

    // Real-time notification to mechanic
    notifyMechanic(mechanic._id.toString(), 'settlementUpdated', {
      type: 'Cash_Commission_Reconciled',
      amount: totalReconciledCommission,
      referenceNumber: refNo,
      message: `Your cash commission of ₹${totalReconciledCommission} for ${bookingsToReconcile.length} bookings was reconciled.`,
    });

    res.status(200).json({
      success: true,
      message: `Successfully reconciled ₹${totalReconciledCommission} cash commission across ${bookingsToReconcile.length} bookings.`,
      settlement: settlementRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin transfers / records payout to mechanic for online payments
// @route   POST /api/admin/settlements/payout-mechanic
// @access  Private (Admin)
const payoutMechanic = async (req, res, next) => {
  try {
    const { mechanicId, bookingIds, referenceNumber, paymentMethod, notes } = req.body;

    if (!mechanicId) {
      return res.status(400).json({
        success: false,
        message: 'Mechanic ID is required.',
      });
    }

    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic not found.',
      });
    }

    const bookingQuery = {
      mechanic: mechanicId,
      paymentMethod: 'Online',
      paymentStatus: 'Paid',
      settlementStatus: 'Pending',
    };

    if (Array.isArray(bookingIds) && bookingIds.length > 0) {
      bookingQuery._id = { $in: bookingIds };
    }

    const bookingsToPayout = await Booking.find(bookingQuery);

    if (bookingsToPayout.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending online earnings found for payout.',
      });
    }

    const refNo = referenceNumber || `PAYOUT-${Date.now()}`;
    let totalPayoutAmount = 0;
    const paidBookingIds = [];

    for (const b of bookingsToPayout) {
      const gross = b.finalCost || b.estimatedCost || 400;
      const earning = b.mechanicEarning > 0
        ? b.mechanicEarning
        : Math.round((gross - (gross * 0.10)) * 100) / 100;
      totalPayoutAmount += earning;
      paidBookingIds.push(b._id);

      b.settlementStatus = 'Settled';
      b.settlementReference = refNo;
      b.settledAt = new Date();
      b.settlementNotes = notes || 'Online earnings payout disbursed by admin';
      await b.save();

      await Payment.updateMany(
        { booking: b._id },
        {
          $set: {
            settlementStatus: 'Settled',
            settlementReference: refNo,
            settledAt: new Date(),
          },
        }
      );
    }

    const settlementRecord = await CommissionSettlement.create({
      settlementId: `STL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      mechanic: mechanic._id,
      settlementType: 'Mechanic_Payout',
      bookings: paidBookingIds,
      amount: Math.round(totalPayoutAmount * 100) / 100,
      amountPaise: Math.round(totalPayoutAmount * 100),
      paymentMethod: paymentMethod || 'Bank_Transfer',
      referenceNumber: refNo,
      status: 'Completed',
      processedBy: req.user._id,
      notes: notes || `Disbursed payout for ${bookingsToPayout.length} online bookings.`,
    });

    notifyMechanic(mechanic._id.toString(), 'settlementUpdated', {
      type: 'Online_Earnings_Paid',
      amount: totalPayoutAmount,
      referenceNumber: refNo,
      message: `Your online service earnings payout of ₹${totalPayoutAmount} was processed (Ref: ${refNo}).`,
    });

    res.status(200).json({
      success: true,
      message: `Successfully recorded payout of ₹${totalPayoutAmount} across ${bookingsToPayout.length} bookings.`,
      settlement: settlementRecord,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getAllUsers,
  toggleBlockUser,
  getAllMechanics,
  approveMechanic,
  rejectMechanic,
  suspendMechanic,
  reactivateMechanic,
  verifyMechanic,
  toggleMechanicActive,
  getAllBookings,
  getAllReviews,
  deleteReview,
  getAdminEarnings,
  reconcileCashCommission,
  payoutMechanic,
};
