const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide service name'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide service description'],
    },
    icon: {
      type: String,
      default: 'bi-wrench-adjustable',
    },
    estimatedPrice: {
      type: Number,
      default: 300,
    },
    vehicleTypes: {
      type: [String],
      default: ['Car', 'Bike', 'Scooter', 'Truck', 'Bus', 'Other'],
    },
    isEmergencyEligible: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);
