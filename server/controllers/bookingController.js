const Booking = require('../models/Booking');
const Mechanic = require('../models/Mechanic');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { calculateDistance } = require('../services/distanceService');
const {
  notifyMechanic,
  broadcastToMechanics,
  notifyCustomer,
  notifyBookingRoom,
  notifyAdmin,
} = require('../services/socketService');

// Helper to generate readable Highway Rescue Booking ID
const generateBookingId = () => {
  const prefix = 'HR';
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomNum}`;
};

// @desc    Create a new roadside assistance booking request
// @route   POST /api/bookings
// @access  Private (Customer)
const createBooking = async (req, res, next) => {
  try {
    const {
      mechanicId,
      serviceType,
      serviceId,
      vehicleType,
      vehicleNumber,
      problemDescription,
      latitude,
      longitude,
      address,
      isEmergency,
      estimatedCost,
    } = req.body;

    if (!serviceType || !vehicleType || !vehicleNumber || !problemDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide service type, vehicle type, vehicle number, and problem description.',
      });
    }

    // Coordinates (default to Ahmedabad center if none provided)
    const lat = latitude ? parseFloat(latitude) : 23.0338;
    const lng = longitude ? parseFloat(longitude) : 72.5186;

    let problemImageUrl = '';
    if (req.file) {
      problemImageUrl = `/uploads/${req.file.filename}`;
    }

    let targetMechanic = null;
    if (mechanicId) {
      targetMechanic = await Mechanic.findById(mechanicId);
    }

    const bookingId = generateBookingId();

    const booking = await Booking.create({
      bookingId,
      customer: req.user._id,
      mechanic: targetMechanic ? targetMechanic._id : null,
      serviceType,
      service: serviceId || null,
      vehicleType,
      vehicleNumber,
      problemDescription,
      problemImage: problemImageUrl,
      customerLocation: {
        type: 'Point',
        coordinates: [lng, lat],
        address: address || 'Highway Location, Ahmedabad, Gujarat',
      },
      status: 'Pending',
      isEmergency: isEmergency === 'true' || isEmergency === true,
      estimatedCost: estimatedCost ? Number(estimatedCost) : (isEmergency ? 500 : 350),
      statusTimeline: [
        {
          status: 'Pending',
          timestamp: new Date(),
          note: isEmergency
            ? 'PRIORITY EMERGENCY Roadside Assistance request initiated.'
            : 'Booking request created and broadcast to nearby mechanics.',
        },
      ],
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name phone email vehicleType vehicleNumber')
      .populate('mechanic', 'name shopName phone rating location');

    // Calculate distance for socket payload if mechanic assigned
    let distanceKm = null;
    if (targetMechanic && targetMechanic.location) {
      distanceKm = calculateDistance(
        lat,
        lng,
        targetMechanic.location.coordinates[1],
        targetMechanic.location.coordinates[0]
      );
    }

    const socketPayload = {
      booking: populatedBooking,
      distanceKm,
      isEmergency: booking.isEmergency,
      message: booking.isEmergency
        ? `EMERGENCY ALERT: Priority breakdown assistance requested nearby!`
        : `New Roadside Service Request: ${serviceType}`,
    };

    // Real-time Notification via Socket.IO
    if (targetMechanic) {
      notifyMechanic(targetMechanic._id.toString(), 'newBookingRequest', socketPayload);
    } else {
      broadcastToMechanics('newBookingRequest', socketPayload);
    }
    notifyAdmin('adminNewBooking', socketPayload);

    res.status(201).json({
      success: true,
      message: 'Booking request created successfully! Waiting for mechanic acceptance.',
      booking: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's bookings (active & history)
// @route   GET /api/bookings/my-bookings
// @access  Private (Customer)
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('mechanic', 'name shopName phone rating location shopAddress isVerified profileImage')
      .sort('-createdAt');

    // Separate active booking from history
    const activeBooking = bookings.find((b) =>
      ['Pending', 'Accepted', 'On The Way', 'Arrived', 'In Progress'].includes(b.status)
    );

    res.status(200).json({
      success: true,
      count: bookings.length,
      activeBooking: activeBooking || null,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mechanic's requests and ongoing bookings
// @route   GET /api/bookings/requests
// @access  Private (Mechanic)
const getMechanicRequests = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic profile not found for this user',
      });
    }

    const mechLng = mechanic.location.coordinates[0];
    const mechLat = mechanic.location.coordinates[1];

    // Find bookings assigned to this mechanic OR pending unassigned bookings
    const bookings = await Booking.find({
      $or: [
        { mechanic: mechanic._id },
        { mechanic: null, status: 'Pending' },
      ],
    })
      .populate('customer', 'name phone email vehicleType vehicleNumber')
      .populate('mechanic', 'name shopName phone rating')
      .sort('-createdAt');

    // Calculate distance to customer for each booking
    const bookingsWithDistance = bookings.map((b) => {
      const custLng = b.customerLocation.coordinates[0];
      const custLat = b.customerLocation.coordinates[1];
      const dist = calculateDistance(mechLat, mechLng, custLat, custLng);
      return {
        ...b.toObject(),
        distanceKm: dist,
      };
    });

    const pendingRequests = bookingsWithDistance.filter((b) => b.status === 'Pending');
    const activeJobs = bookingsWithDistance.filter((b) =>
      ['Accepted', 'On The Way', 'Arrived', 'In Progress'].includes(b.status)
    );
    const completedJobs = bookingsWithDistance.filter((b) => b.status === 'Completed');

    res.status(200).json({
      success: true,
      pendingRequests,
      activeJobs,
      completedJobs,
      all: bookingsWithDistance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mechanic accepts a booking request
// @route   PUT /api/bookings/:id/accept
// @access  Private (Mechanic)
const acceptBooking = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    if (!mechanic) {
      return res.status(403).json({
        success: false,
        message: 'Only registered mechanics can accept booking requests.',
      });
    }

    if (!mechanic.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin verification. You can accept jobs once verified.',
      });
    }

    // Atomic conditional update: ONLY accept if status is still 'Pending'
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: req.params.id, status: 'Pending' },
      {
        $set: {
          mechanic: mechanic._id,
          status: 'Accepted',
        },
        $push: {
          statusTimeline: {
            status: 'Accepted',
            timestamp: new Date(),
            note: `Booking accepted by ${mechanic.name} (${mechanic.shopName}).`,
          },
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      const existing = await Booking.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }
      return res.status(409).json({
        success: false,
        message: `Booking cannot be accepted. It is currently in '${existing.status}' status.`,
      });
    }

    const populatedBooking = await Booking.findById(updatedBooking._id)
      .populate('customer', 'name phone email vehicleType vehicleNumber')
      .populate('mechanic', 'name shopName phone rating shopAddress profileImage');

    // Real-time update to customer & rooms
    notifyCustomer(updatedBooking.customer.toString(), 'bookingAccepted', {
      booking: populatedBooking,
      message: `${mechanic.name} has accepted your request! Help is on the way.`,
    });
    notifyBookingRoom(updatedBooking._id.toString(), 'bookingStatusUpdated', populatedBooking);
    notifyAdmin('adminBookingUpdated', populatedBooking);

    res.status(200).json({
      success: true,
      message: 'Booking accepted! Customer contact details are now available.',
      booking: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mechanic rejects a booking request
// @route   PUT /api/bookings/:id/reject
// @access  Private (Mechanic)
const rejectBooking = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // If targeted to this specific mechanic, reopen to general broadcast or leave pending
    if (booking.mechanic && booking.mechanic.toString() === mechanic._id.toString()) {
      booking.mechanic = null;
      booking.statusTimeline.push({
        status: 'Pending',
        timestamp: new Date(),
        note: `Mechanic ${mechanic.name} was unavailable. Re-broadcasting to nearby mechanics.`,
      });
      await booking.save();
      broadcastToMechanics('newBookingRequest', { booking, message: 'Re-broadcasted service request' });
    }

    res.status(200).json({
      success: true,
      message: 'Booking rejected.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (On The Way, Arrived, In Progress, Completed)
// @route   PUT /api/bookings/:id/status
// @access  Private (Mechanic)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, finalCost, note } = req.body;
    const mechanic = await Mechanic.findOne({ user: req.user._id });

    const validStatuses = ['On The Way', 'Arrived', 'In Progress', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check ownership
    if (booking.mechanic && booking.mechanic.toString() !== mechanic._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this booking.',
      });
    }

    booking.status = status;
    booking.statusTimeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status} by mechanic.`,
    });

    if (status === 'Completed') {
      const charge = finalCost ? Number(finalCost) : (booking.estimatedCost || 400);
      booking.finalCost = charge;
      booking.paymentStatus = 'Pending'; // pending customer payment or cash handoff

      // Update mechanic stats
      mechanic.totalJobsCompleted += 1;
      mechanic.totalEarnings += charge;
      await mechanic.save();

      // Create Payment record
      await Payment.create({
        booking: booking._id,
        customer: booking.customer,
        mechanic: mechanic._id,
        amount: charge,
        paymentMethod: booking.paymentMethod || 'Cash',
        status: 'Created',
      });
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name phone email vehicleType vehicleNumber')
      .populate('mechanic', 'name shopName phone rating shopAddress profileImage');

    // Notify customer & live room via Socket.IO
    notifyCustomer(booking.customer.toString(), 'bookingStatusUpdated', {
      booking: populatedBooking,
      status,
      message: `Your booking status has been updated to: ${status}`,
    });
    notifyBookingRoom(booking._id.toString(), 'bookingStatusUpdated', populatedBooking);
    notifyAdmin('adminBookingUpdated', populatedBooking);

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Customer, Mechanic, Admin)
const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Customer cancellation logic
    if (req.user.role === 'customer') {
      // 1. Verify authenticated customer owns the booking
      if (booking.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to cancel another customer\'s booking.',
        });
      }

      // 2. Customer can ONLY cancel when status is 'Pending'
      if (booking.status !== 'Pending') {
        if (['Accepted', 'On The Way', 'Arrived', 'In Progress'].includes(booking.status)) {
          return res.status(409).json({
            success: false,
            message: 'Booking cannot be cancelled because the mechanic has already accepted the request.',
          });
        }
        return res.status(409).json({
          success: false,
          message: `Booking cannot be cancelled because it is already ${booking.status}.`,
        });
      }

      // 3. Atomic conditional update to prevent race conditions (e.g. mechanic accepts simultaneously)
      const cancellationReason = reason || 'Cancelled by user';
      const cancelledBooking = await Booking.findOneAndUpdate(
        {
          _id: req.params.id,
          customer: req.user._id,
          status: 'Pending',
        },
        {
          $set: {
            status: 'Cancelled',
            cancellationReason,
            cancelledBy: 'customer',
          },
          $push: {
            statusTimeline: {
              status: 'Cancelled',
              timestamp: new Date(),
              note: `Booking cancelled by customer. Reason: ${cancellationReason}`,
            },
          },
        },
        { new: true }
      );

      // If atomic update returned null, status changed concurrently (e.g. mechanic accepted)
      if (!cancelledBooking) {
        const currentBooking = await Booking.findById(req.params.id);
        if (currentBooking && ['Accepted', 'On The Way', 'Arrived', 'In Progress'].includes(currentBooking.status)) {
          return res.status(409).json({
            success: false,
            message: 'Booking cannot be cancelled because the mechanic has already accepted the request.',
          });
        }
        return res.status(409).json({
          success: false,
          message: `Booking cannot be cancelled because it is already ${currentBooking ? currentBooking.status : 'processed'}.`,
        });
      }

      const populatedBooking = await Booking.findById(cancelledBooking._id)
        .populate('customer', 'name phone email')
        .populate('mechanic', 'name shopName phone');

      // Real-time Socket.IO notifications
      if (cancelledBooking.mechanic) {
        notifyMechanic(cancelledBooking.mechanic.toString(), 'bookingCancelled', {
          booking: populatedBooking,
          message: `Customer cancelled booking ${cancelledBooking.bookingId}`,
        });
      } else {
        broadcastToMechanics('bookingCancelled', {
          booking: populatedBooking,
          message: `Booking request ${cancelledBooking.bookingId} was cancelled by the customer.`,
        });
      }
      notifyCustomer(cancelledBooking.customer.toString(), 'bookingCancelled', {
        booking: populatedBooking,
        message: `Your booking ${cancelledBooking.bookingId} was successfully cancelled.`,
      });
      notifyBookingRoom(cancelledBooking._id.toString(), 'bookingCancelled', populatedBooking);
      notifyAdmin('adminBookingCancelled', populatedBooking);

      return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully.',
        booking: populatedBooking,
      });
    }

    // Mechanic cancellation workflow
    if (req.user.role === 'mechanic') {
      const mechanic = await Mechanic.findOne({ user: req.user._id });
      if (!mechanic) {
        return res.status(403).json({
          success: false,
          message: 'Mechanic profile not found.',
        });
      }

      if (booking.mechanic && booking.mechanic.toString() !== mechanic._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not assigned to this booking.',
        });
      }

      if (['Completed', 'Cancelled'].includes(booking.status)) {
        return res.status(409).json({
          success: false,
          message: `Cannot cancel a booking that is already ${booking.status}.`,
        });
      }

      const cancellationReason = reason || 'Cancelled by mechanic';
      const cancelledBooking = await Booking.findOneAndUpdate(
        {
          _id: req.params.id,
          mechanic: mechanic._id,
          status: { $nin: ['Completed', 'Cancelled'] },
        },
        {
          $set: {
            status: 'Cancelled',
            cancellationReason,
            cancelledBy: 'mechanic',
          },
          $push: {
            statusTimeline: {
              status: 'Cancelled',
              timestamp: new Date(),
              note: `Booking cancelled by mechanic. Reason: ${cancellationReason}`,
            },
          },
        },
        { new: true }
      );

      if (!cancelledBooking) {
        return res.status(409).json({
          success: false,
          message: 'Failed to cancel booking. It may have already been completed or cancelled.',
        });
      }

      const populatedBooking = await Booking.findById(cancelledBooking._id)
        .populate('customer', 'name phone email')
        .populate('mechanic', 'name shopName phone');

      notifyCustomer(cancelledBooking.customer._id.toString(), 'bookingCancelled', {
        booking: populatedBooking,
        message: `Mechanic cancelled booking ${cancelledBooking.bookingId}. Re-broadcasting...`,
      });
      notifyBookingRoom(cancelledBooking._id.toString(), 'bookingCancelled', populatedBooking);
      notifyAdmin('adminBookingCancelled', populatedBooking);

      return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully.',
        booking: populatedBooking,
      });
    }

    // Admin cancellation workflow
    if (req.user.role === 'admin') {
      if (['Completed', 'Cancelled'].includes(booking.status)) {
        return res.status(409).json({
          success: false,
          message: `Cannot cancel a booking that is already ${booking.status}.`,
        });
      }

      const cancellationReason = reason || 'Cancelled by admin';
      const cancelledBooking = await Booking.findOneAndUpdate(
        {
          _id: req.params.id,
          status: { $nin: ['Completed', 'Cancelled'] },
        },
        {
          $set: {
            status: 'Cancelled',
            cancellationReason,
            cancelledBy: 'admin',
          },
          $push: {
            statusTimeline: {
              status: 'Cancelled',
              timestamp: new Date(),
              note: `Booking cancelled by admin. Reason: ${cancellationReason}`,
            },
          },
        },
        { new: true }
      );

      const populatedBooking = await Booking.findById(cancelledBooking._id)
        .populate('customer', 'name phone email')
        .populate('mechanic', 'name shopName phone');

      if (cancelledBooking.mechanic) {
        notifyMechanic(cancelledBooking.mechanic.toString(), 'bookingCancelled', {
          booking: populatedBooking,
          message: `Admin cancelled booking ${cancelledBooking.bookingId}`,
        });
      }
      notifyCustomer(cancelledBooking.customer._id.toString(), 'bookingCancelled', {
        booking: populatedBooking,
        message: `Admin cancelled booking ${cancelledBooking.bookingId}.`,
      });
      notifyBookingRoom(cancelledBooking._id.toString(), 'bookingCancelled', populatedBooking);
      notifyAdmin('adminBookingCancelled', populatedBooking);

      return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully.',
        booking: populatedBooking,
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Unauthorized role for cancellation.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name phone email vehicleType vehicleNumber')
      .populate('mechanic', 'name shopName phone rating location shopAddress profileImage isVerified')
      .populate('service');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getMechanicRequests,
  acceptBooking,
  rejectBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingById,
};
