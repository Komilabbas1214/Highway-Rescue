const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const { notifyMechanic, notifyCustomer } = require('../services/socketService');

// @desc    Admin dashboard metrics summary
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalMechanics = await Mechanic.countDocuments();
    const verifiedMechanics = await Mechanic.countDocuments({ isVerified: true });
    const pendingMechanics = await Mechanic.countDocuments({ isVerified: false });

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
    const { verified, search } = req.query;
    const query = {};

    if (verified !== undefined && verified !== '') {
      query.isVerified = verified === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shopName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
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

// @desc    Verify or reject mechanic application
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
    mechanic.verifiedAt = isVerified ? new Date() : null;
    mechanic.verifiedBy = isVerified ? req.user._id : null;
    if (verificationNotes !== undefined) {
      mechanic.verificationNotes = verificationNotes;
    }

    await mechanic.save();

    // Notify mechanic via Socket
    notifyMechanic(mechanic._id.toString(), 'verificationStatusUpdated', {
      isVerified: mechanic.isVerified,
      message: isVerified
        ? 'Congratulations! Your mechanic account has been verified by the admin. You are now eligible to accept service requests.'
        : 'Your verification status has been updated.',
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

module.exports = {
  getAdminDashboard,
  getAllUsers,
  toggleBlockUser,
  getAllMechanics,
  verifyMechanic,
  toggleMechanicActive,
  getAllBookings,
  getAllReviews,
  deleteReview,
};
