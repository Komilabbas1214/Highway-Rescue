const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide mobile number'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      lowercase: true,
      trim: true,
    },
    shopName: {
      type: String,
      trim: true,
      default: 'Highway Rescue Partner Garage',
    },
    serviceCategory: {
      type: String,
      enum: ['Bike', 'Car', 'Both'],
      default: 'Both',
    },
    serviceArea: {
      type: String,
      default: 'Ahmedabad',
      trim: true,
    },
    services: {
      type: [String],
      required: [true, 'Please select at least one service offered'],
      default: ['Puncture Repair', 'General Mechanic'],
    },
    experience: {
      type: Number,
      default: 2,
      min: [0, 'Experience cannot be negative'],
    },
    shopAddress: {
      type: String,
      required: [true, 'Please provide shop or garage address'],
    },
    city: {
      type: String,
      default: 'Ahmedabad',
    },
    state: {
      type: String,
      default: 'Gujarat',
    },
    pincode: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    serviceRadius: {
      type: Number,
      default: 25, // default 25 km
    },
    profileImage: {
      type: String,
      default: '',
    },
    idDocument: {
      type: String,
      default: '',
    },
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
      default: 'Pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    suspensionReason: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: false, // Must be approved first, then toggled online by mechanic
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalJobsCompleted: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for GeoJSON location searches
mechanicSchema.index({ location: '2dsphere' });
mechanicSchema.index({ approvalStatus: 1 });
mechanicSchema.index({ isOnline: 1 });

module.exports = mongoose.model('Mechanic', mechanicSchema);
