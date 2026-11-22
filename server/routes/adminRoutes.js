const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllUsers,
  toggleBlockUser,
  getAllMechanics,
  verifyMechanic,
  toggleMechanicActive,
  getAllBookings,
  getAllReviews,
  deleteReview,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleBlockUser);

router.get('/mechanics', getAllMechanics);
router.put('/mechanics/:id/verify', verifyMechanic);
router.put('/mechanics/:id/toggle-active', toggleMechanicActive);

router.get('/bookings', getAllBookings);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
