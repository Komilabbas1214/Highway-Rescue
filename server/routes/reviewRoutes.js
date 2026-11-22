const express = require('express');
const router = express.Router();
const {
  createReview,
  getMechanicReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/:mechanicId', getMechanicReviews);
router.post('/', protect, authorize('customer'), createReview);

module.exports = router;
