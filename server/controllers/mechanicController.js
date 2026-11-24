const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const jwt = require('jsonwebtoken');
const { calculateDistance } = require('../services/distanceService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'highway_rescue_jwt_secret_key_2026_super_secure_auth',
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

// @desc    Register a new mechanic / service provider
// @route   POST /api/mechanics/register
// @access  Public
const registerMechanic = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      serviceCategory,
      shopName,
      services,
      experience,
      shopAddress,
      city,
      state,
      pincode,
      latitude,
      longitude,
      serviceRadius,
      serviceArea,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !shopAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: full name, email, mobile number, password, and shop address.',
      });
    }

    // Check password confirmation if provided
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter your password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();

    // Check duplicate email across User and Mechanic
    const existingUserEmail = await User.findOne({ email: normalizedEmail });
    if (existingUserEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }
    const existingMechEmail = await Mechanic.findOne({ email: normalizedEmail });
    if (existingMechEmail) {
      return res.status(400).json({
        success: false,
        message: 'A mechanic with this email address already exists.',
      });
    }

    // Check duplicate phone across User and Mechanic
    const existingUserPhone = await User.findOne({ phone: normalizedPhone });
    if (existingUserPhone) {
      return res.status(400).json({
        success: false,
        message: 'An account with this mobile number already exists.',
      });
    }
    const existingMechPhone = await Mechanic.findOne({ phone: normalizedPhone });
    if (existingMechPhone) {
      return res.status(400).json({
        success: false,
        message: 'A mechanic with this mobile number already exists.',
      });
    }

    // Default to Ahmedabad coordinates if not provided (23.0338, 72.5186)
    const lat = latitude ? parseFloat(latitude) : 23.0338;
    const lng = longitude ? parseFloat(longitude) : 72.5186;

    // Parse services
    let parsedServices = [];
    if (typeof services === 'string') {
      try {
        parsedServices = JSON.parse(services);
      } catch (e) {
        parsedServices = services.split(',').map((s) => s.trim());
      }
    } else if (Array.isArray(services)) {
      parsedServices = services;
    }

    if (!parsedServices || parsedServices.length === 0) {
      parsedServices = ['Puncture Repair', 'General Mechanic'];
    }

    // Validate service category
    const validCategories = ['Bike', 'Car', 'Both'];
    const finalServiceCategory = validCategories.includes(serviceCategory) ? serviceCategory : 'Both';

    // Handle uploaded files
    let profileImageUrl = '';
    let idDocumentUrl = '';

    if (req.files) {
      if (req.files.profileImage && req.files.profileImage[0]) {
        profileImageUrl = `/uploads/${req.files.profileImage[0].filename}`;
      }
      if (req.files.idDocument && req.files.idDocument[0]) {
        idDocumentUrl = `/uploads/${req.files.idDocument[0].filename}`;
      }
    }

    // Create User record
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      role: 'mechanic',
    });

    const finalShopName = shopName && shopName.trim()
      ? shopName.trim()
      : `${name.trim()}'s Auto Care`;

    // Create Mechanic profile - strictly initialized as Pending and unverified
    const mechanic = await Mechanic.create({
      user: user._id,
      name: name.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      shopName: finalShopName,
      serviceCategory: finalServiceCategory,
      serviceArea: serviceArea && serviceArea.trim() ? serviceArea.trim() : 'Ahmedabad',
      services: parsedServices,
      experience: experience ? Number(experience) : 2,
      shopAddress: shopAddress.trim(),
      city: city || 'Ahmedabad',
      state: state || 'Gujarat',
      pincode: pincode || '380015',
      location: {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON order: [longitude, latitude]
      },
      serviceRadius: serviceRadius ? Number(serviceRadius) : 25,
      profileImage: profileImageUrl,
      idDocument: idDocumentUrl,
      approvalStatus: 'Pending', // Enforce Pending status on registration
      isVerified: false,         // Must be approved and verified by admin
      isOnline: false,           // Cannot go online until approved
      isActive: true,
      isDemo: false,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Mechanic registration submitted successfully! Your account is under verification and will be reviewed by admin.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      mechanic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Find nearby mechanics
// @route   GET /api/mechanics/nearby
// @access  Public
const getNearbyMechanics = async (req, res, next) => {
  try {
    const { lat, lng, radius, serviceCategory, verifiedOnly, onlineOnly } = req.query;

    // Default coordinates: Ahmedabad (SG Highway / ISCON)
    const userLat = lat ? parseFloat(lat) : 23.0338;
    const userLng = lng ? parseFloat(lng) : 72.5186;
    const searchRadiusKm = radius ? parseFloat(radius) : 25; // in kilometers

    // Strictly enforce: only approved, verified, active, non-demo mechanics
    const query = {
      approvalStatus: 'Approved',
      isVerified: true,
      isActive: true,
      isDemo: { $ne: true },
    };

    // By default, filter for online mechanics unless explicitly asked for directory
    if (onlineOnly !== 'false') {
      query.isOnline = true;
    }

    if (serviceCategory && serviceCategory !== 'All') {
      query.$or = [
        { serviceCategory: serviceCategory },
        { serviceCategory: 'Both' },
        { services: { $regex: new RegExp(serviceCategory, 'i') } },
      ];
    }

    // Use MongoDB GeoJSON $geoNear or $nearSphere, excluding sensitive idDocument
    let mechanics = [];
    try {
      mechanics = await Mechanic.find({
        ...query,
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [userLng, userLat],
            },
            $maxDistance: searchRadiusKm * 1000, // meters
          },
        },
      })
        .select('-idDocument')
        .populate('user', 'name phone email');
    } catch (geoErr) {
      // Fallback if 2dsphere index is warming up
      console.warn('[Mechanic Finder] Fallback search without geoNear:', geoErr.message);
      mechanics = await Mechanic.find(query)
        .select('-idDocument')
        .populate('user', 'name phone email');
    }

    // Map distance in km for every mechanic
    const result = mechanics.map((m) => {
      const mechLng = m.location?.coordinates?.[0] || userLng;
      const mechLat = m.location?.coordinates?.[1] || userLat;
      const dist = calculateDistance(userLat, userLng, mechLat, mechLng);
      return {
        ...m.toObject(),
        distanceKm: dist,
      };
    });

    // Sort by distance
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

// @desc    Get mechanic details by ID
// @route   GET /api/mechanics/:id
// @access  Public
const getMechanicById = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id).populate('user', 'name email phone');
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic not found',
      });
    }

    // Check if caller is admin or mechanic profile owner
    const isSelfOrAdmin =
      req.user &&
      (req.user.role === 'admin' ||
        (mechanic.user && req.user._id.toString() === mechanic.user._id.toString()));

    if (!isSelfOrAdmin) {
      // Public caller can only view approved, active, non-demo mechanics
      if (mechanic.approvalStatus !== 'Approved' || !mechanic.isActive || mechanic.isDemo) {
        return res.status(404).json({
          success: false,
          message: 'Mechanic profile not found or unavailable',
        });
      }
      // Never expose sensitive identity documents to public callers
      mechanic.idDocument = undefined;
    }

    const reviews = await Review.find({ mechanic: mechanic._id, isReported: false })
      .populate('customer', 'name')
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      data: mechanic,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle online / offline availability
// @route   PUT /api/mechanics/availability
// @access  Private (Mechanic)
const toggleAvailability = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic profile not found for this user',
      });
    }

    const requestedOnline = req.body.isOnline !== undefined ? Boolean(req.body.isOnline) : !mechanic.isOnline;
    const isApproved = mechanic.approvalStatus === 'Approved' && mechanic.isVerified && mechanic.isActive;

    // Disallow unapproved, pending, rejected, or suspended mechanics from going online
    if (requestedOnline && !isApproved) {
      let message = 'You cannot go online until your account is approved and verified by an administrator.';
      if (mechanic.approvalStatus === 'Pending') {
        message = 'Your account is under verification. You will be able to go online once approved by admin.';
      } else if (mechanic.approvalStatus === 'Rejected') {
        message = `Your application was rejected: ${mechanic.rejectionReason || 'Please contact support.'}`;
      } else if (mechanic.approvalStatus === 'Suspended') {
        message = `Your account has been suspended: ${mechanic.suspensionReason || 'Please contact support.'}`;
      }
      return res.status(403).json({
        success: false,
        message,
        approvalStatus: mechanic.approvalStatus,
        isVerified: mechanic.isVerified,
      });
    }

    mechanic.isOnline = requestedOnline;
    await mechanic.save();

    res.status(200).json({
      success: true,
      message: `Status updated: You are now ${mechanic.isOnline ? 'ONLINE and accepting requests' : 'OFFLINE'}`,
      isOnline: mechanic.isOnline,
      approvalStatus: mechanic.approvalStatus,
      mechanic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update mechanic profile
// @route   PUT /api/mechanics/profile
// @access  Private (Mechanic)
const updateMechanicProfile = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic profile not found',
      });
    }

    const {
      shopName,
      services,
      experience,
      shopAddress,
      city,
      state,
      pincode,
      latitude,
      longitude,
      serviceRadius,
    } = req.body;

    if (shopName) mechanic.shopName = shopName;
    if (experience !== undefined) mechanic.experience = Number(experience);
    if (shopAddress) mechanic.shopAddress = shopAddress;
    if (city) mechanic.city = city;
    if (state) mechanic.state = state;
    if (pincode) mechanic.pincode = pincode;
    if (serviceRadius) mechanic.serviceRadius = Number(serviceRadius);

    if (services) {
      if (Array.isArray(services)) {
        mechanic.services = services;
      } else if (typeof services === 'string') {
        try {
          mechanic.services = JSON.parse(services);
        } catch (e) {
          mechanic.services = services.split(',').map((s) => s.trim());
        }
      }
    }

    if (latitude && longitude) {
      mechanic.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    if (req.files) {
      if (req.files.profileImage && req.files.profileImage[0]) {
        mechanic.profileImage = `/uploads/${req.files.profileImage[0].filename}`;
      }
      if (req.files.idDocument && req.files.idDocument[0]) {
        mechanic.idDocument = `/uploads/${req.files.idDocument[0].filename}`;
      }
    }

    await mechanic.save();

    res.status(200).json({
      success: true,
      message: 'Mechanic profile updated successfully!',
      mechanic,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mechanic dashboard statistics
// @route   GET /api/mechanics/dashboard/stats
// @access  Private (Mechanic)
const getMechanicDashboardStats = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic not found',
      });
    }

    const totalBookings = await Booking.countDocuments({ mechanic: mechanic._id });
    const pendingRequests = await Booking.countDocuments({
      status: 'Pending',
      $or: [{ mechanic: mechanic._id }, { mechanic: null }],
    });
    const acceptedRequests = await Booking.countDocuments({
      mechanic: mechanic._id,
      status: { $in: ['Accepted', 'On The Way', 'Arrived', 'In Progress'] },
    });
    const completedJobs = await Booking.countDocuments({
      mechanic: mechanic._id,
      status: 'Completed',
    });

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        pendingRequests,
        acceptedRequests,
        completedJobs,
        totalEarnings: mechanic.totalEarnings || 0,
        isOnline: mechanic.isOnline,
        isVerified: mechanic.isVerified,
        approvalStatus: mechanic.approvalStatus || (mechanic.isVerified ? 'Approved' : 'Pending'),
        rejectionReason: mechanic.rejectionReason || '',
        suspensionReason: mechanic.suspensionReason || '',
        rating: mechanic.rating,
        totalReviews: mechanic.totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mechanic earnings breakdown & commission settlements
// @route   GET /api/mechanics/earnings
// @access  Private (Mechanic)
const getMechanicEarnings = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    if (!mechanic) {
      return res.status(404).json({
        success: false,
        message: 'Mechanic profile not found',
      });
    }

    const bookings = await Booking.find({
      mechanic: mechanic._id,
      status: 'Completed',
    })
      .populate('customer', 'name phone email vehicleNumber')
      .sort('-createdAt');

    let totalServiceEarnings = 0;
    let platformCommissionDeducted = 0;
    let netMechanicEarnings = 0;
    let cashCollected = 0;
    let cashCommissionPayable = 0;
    let cashCommissionSettled = 0;
    let onlineGross = 0;
    let onlinePaidOut = 0;
    let onlinePayoutPending = 0;

    const bookingWiseEarnings = bookings.map((b) => {
      const gross = b.finalCost || b.estimatedCost || 400;
      const rate = b.commissionRate || 0.10;
      const comm = b.platformCommission > 0
        ? b.platformCommission
        : Math.round(gross * rate * 100) / 100;
      const net = b.mechanicEarning > 0
        ? b.mechanicEarning
        : Math.round((gross - comm) * 100) / 100;

      totalServiceEarnings += gross;
      platformCommissionDeducted += comm;
      netMechanicEarnings += net;

      if (b.paymentMethod === 'Cash') {
        cashCollected += gross;
        if (b.settlementStatus === 'Settled') {
          cashCommissionSettled += comm;
        } else {
          cashCommissionPayable += comm;
        }
      } else {
        onlineGross += gross;
        if (b.settlementStatus === 'Settled') {
          onlinePaidOut += net;
        } else {
          onlinePayoutPending += net;
        }
      }

      return {
        bookingId: b._id,
        bookingNumber: b.bookingId,
        serviceType: b.serviceType,
        vehicleNumber: b.vehicleNumber,
        customerName: b.customer?.name || 'Customer',
        date: b.createdAt,
        finalCost: gross,
        commissionRate: rate,
        platformCommission: comm,
        netEarning: net,
        paymentMethod: b.paymentMethod || 'Cash',
        paymentStatus: b.paymentStatus || 'Pending',
        settlementStatus: b.settlementStatus || 'Pending',
        settlementReference: b.settlementReference || '',
        settledAt: b.settledAt || null,
      };
    });

    const netBalance = Math.round((onlinePayoutPending - cashCommissionPayable) * 100) / 100;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCompletedJobs: bookings.length,
          totalServiceEarnings: Math.round(totalServiceEarnings * 100) / 100,
          platformCommissionDeducted: Math.round(platformCommissionDeducted * 100) / 100,
          netMechanicEarnings: Math.round(netMechanicEarnings * 100) / 100,
          cashCollected: Math.round(cashCollected * 100) / 100,
          cashCommissionPayable: Math.round(cashCommissionPayable * 100) / 100,
          cashCommissionSettled: Math.round(cashCommissionSettled * 100) / 100,
          onlineGross: Math.round(onlineGross * 100) / 100,
          onlinePaidOut: Math.round(onlinePaidOut * 100) / 100,
          onlinePayoutPending: Math.round(onlinePayoutPending * 100) / 100,
          netBalance,
        },
        bookingWiseEarnings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerMechanic,
  getNearbyMechanics,
  getMechanicById,
  toggleAvailability,
  updateMechanicProfile,
  getMechanicDashboardStats,
  getMechanicEarnings,
};
