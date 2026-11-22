const express = require('express');
const router = express.Router();
const {
  registerMechanic,
  getNearbyMechanics,
  getMechanicById,
  toggleAvailability,
  updateMechanicProfile,
  getMechanicDashboardStats,
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
router.get('/:id', getMechanicById);

// Protected routes (Mechanic only)
router.use(protect);
router.use(authorize('mechanic'));
router.put('/availability', toggleAvailability);
router.get('/dashboard/stats', getMechanicDashboardStats);
router.put(
  '/profile',
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
  ]),
  updateMechanicProfile
);

module.exports = router;
