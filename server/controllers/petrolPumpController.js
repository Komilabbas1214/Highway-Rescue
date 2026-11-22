const PetrolPump = require('../models/PetrolPump');
const { calculateDistance, getGoogleMapsDirectionsUrl } = require('../services/distanceService');

// @desc    Find nearby petrol pumps
// @route   GET /api/petrol-pumps/nearby
// @access  Public
const getNearbyPetrolPumps = async (req, res, next) => {
  try {
    const { lat, lng, radius, fuelType } = req.query;

    const userLat = lat ? parseFloat(lat) : 23.0338;
    const userLng = lng ? parseFloat(lng) : 72.5186;
    const searchRadiusKm = radius ? parseFloat(radius) : 30;

    const query = {};
    if (fuelType && fuelType !== 'All') {
      query.fuelTypes = fuelType;
    }

    let pumps = [];
    try {
      pumps = await PetrolPump.find({
        ...query,
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [userLng, userLat],
            },
            $maxDistance: searchRadiusKm * 1000,
          },
        },
      });
    } catch (geoErr) {
      console.warn('[Petrol Pump Finder] Fallback search:', geoErr.message);
      pumps = await PetrolPump.find(query);
    }

    const result = pumps.map((p) => {
      const pLng = p.location.coordinates[0];
      const pLat = p.location.coordinates[1];
      const dist = calculateDistance(userLat, userLng, pLat, pLng);
      return {
        ...p.toObject(),
        distanceKm: dist,
        directionsUrl: getGoogleMapsDirectionsUrl(userLat, userLng, pLat, pLng),
      };
    });

    result.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
      searchCenter: { lat: userLat, lng: userLng },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all petrol pumps
// @route   GET /api/petrol-pumps
// @access  Public
const getAllPetrolPumps = async (req, res, next) => {
  try {
    const pumps = await PetrolPump.find().sort('name');
    res.status(200).json({
      success: true,
      count: pumps.length,
      data: pumps,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyPetrolPumps,
  getAllPetrolPumps,
};
