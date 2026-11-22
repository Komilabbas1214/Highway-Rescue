const express = require('express');
const router = express.Router();
const {
  getNearbyPetrolPumps,
  getAllPetrolPumps,
} = require('../controllers/petrolPumpController');

router.get('/nearby', getNearbyPetrolPumps);
router.get('/', getAllPetrolPumps);

module.exports = router;
