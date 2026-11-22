const express = require('express');
const router = express.Router();
const {
  submitContact,
  getAllContacts,
  updateContactStatus,
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', submitContact);

// Admin-only management routes
router.use(protect);
router.use(authorize('admin'));
router.get('/', getAllContacts);
router.put('/:id', updateContactStatus);

module.exports = router;
