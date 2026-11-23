const express = require('express');
const router = express.Router();
const {
  registerMechanic,
  getNearbyMechanics,
  getMechanicById,
  toggleAvailability,
  updateMechanicProfile,
  getMechanicDashboardStats,
  getMechanicEarnings,
} = require('../controllers/mechanicController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.post(
  '/register',
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
  ]),
  registerMechanic
);
router.get('/nearby', getNearbyMechanics);
// Protected routes (Mechanic only)
router.use('/availability', protect, authorize('mechanic'));
router.use('/dashboard', protect, authorize('mechanic'));
router.use('/earnings', protect, authorize('mechanic'));
router.use('/profile', protect, authorize('mechanic'));

router.put('/availability', toggleAvailability);
router.get('/dashboard/stats', getMechanicDashboardStats);
router.get('/earnings', getMechanicEarnings);
router.put(
  '/profile',
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
  ]),
  updateMechanicProfile
);

// Parameterized public route placed at end so it doesn't intercept specific routes
router.get('/:id', getMechanicById);

module.exports = router;
