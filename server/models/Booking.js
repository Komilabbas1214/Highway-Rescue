const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mechanic',
      default: null,
    },
    serviceType: {
      type: String,
      required: [true, 'Please select service type'],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    vehicleType: {
      type: String,
      enum: ['Car', 'Bike', 'Scooter', 'Truck', 'Bus', 'Other'],
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Please provide vehicle registration number'],
      trim: true,
    },
    problemDescription: {
      type: String,
      required: [true, 'Please describe your vehicle problem'],
    },
    problemImage: {
      type: String,
      default: '',
    },
    customerLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        default: 'Near Highway Highway Rescue Point',
      },
    },
    mechanicLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Accepted',
        'On The Way',
        'Arrived',
        'In Progress',
        'Completed',
        'Cancelled',
      ],
      default: 'Pending',
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    estimatedCost: {
      type: Number,
      default: null,
    },
    finalCost: {
      type: Number,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Online'],
      default: 'Cash',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    // Platform Commission & Settlement Tracking
    commissionRate: {
      type: Number,
      default: 0.10, // Default 10% platform commission
    },
    platformCommission: {
      type: Number,
      default: 0,
    },
    mechanicEarning: {
      type: Number,
      default: 0,
    },
    commissionPaise: {
      type: Number,
      default: 0,
    },
    mechanicEarningPaise: {
      type: Number,
      default: 0,
    },
    settlementStatus: {
      type: String,
      enum: ['Pending', 'Settled', 'Disputed', 'Deducted'],
      default: 'Pending',
    },
    settlementReference: {
      type: String,
      default: '',
    },
    settledAt: {
      type: Date,
      default: null,
    },
    settlementNotes: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'mechanic', 'admin', 'system', ''],
      default: '',
    },
    statusTimeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ customerLocation: '2dsphere' });

module.exports = mongoose.model('Booking', bookingSchema);
