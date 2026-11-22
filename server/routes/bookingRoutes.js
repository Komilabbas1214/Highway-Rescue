const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getMechanicRequests,
  acceptBooking,
  rejectBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingById,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

// Customer endpoints
router.post('/', upload.single('problemImage'), createBooking);
router.get('/my-bookings', getMyBookings);

// Mechanic endpoints
router.get('/requests', authorize('mechanic'), getMechanicRequests);
router.put('/:id/accept', authorize('mechanic'), acceptBooking);
router.put('/:id/reject', authorize('mechanic'), rejectBooking);
router.put('/:id/status', authorize('mechanic'), updateBookingStatus);

// Shared endpoints
router.put('/:id/cancel', cancelBooking);
router.get('/:id', getBookingById);

module.exports = router;
