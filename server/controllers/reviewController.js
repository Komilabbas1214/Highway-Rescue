const Review = require('../models/Review');
const Mechanic = require('../models/Mechanic');
const Booking = require('../models/Booking');

// @desc    Submit review for a completed booking
// @route   POST /api/reviews
// @access  Private (Customer)
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID and rating (1-5).',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only review bookings made from your account.',
      });
    }

    if (booking.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted after the service is Completed.',
      });
    }

    if (!booking.mechanic) {
      return res.status(400).json({
        success: false,
        message: 'No mechanic was assigned to this booking.',
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: booking._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this booking.',
      });
    }

    const review = await Review.create({
      booking: booking._id,
      customer: req.user._id,
      mechanic: booking.mechanic,
      rating: Number(rating),
      comment: comment || '',
    });

    // Recalculate mechanic's average rating
    const allMechanicReviews = await Review.find({ mechanic: booking.mechanic });
    const avgRating =
      allMechanicReviews.reduce((acc, curr) => acc + curr.rating, 0) /
      allMechanicReviews.length;

    await Mechanic.findByIdAndUpdate(booking.mechanic, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: allMechanicReviews.length,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted successfully.',
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a mechanic
// @route   GET /api/reviews/:mechanicId
// @access  Public
const getMechanicReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      mechanic: req.params.mechanicId,
      isReported: false,
    })
      .populate('customer', 'name')
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

module.exports = {
  createReview,
  getMechanicReviews,
};
