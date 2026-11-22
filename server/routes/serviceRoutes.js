const express = require('express');
const router = express.Router();
const {
  getServices,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getServices);

// Admin-only management routes
router.use(protect);
router.use(authorize('admin'));
router.post('/', createService);
router.route('/:id').put(updateService).delete(deleteService);

module.exports = router;
