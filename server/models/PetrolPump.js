const mongoose = require('mongoose');

const petrolPumpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide petrol pump name'],
      trim: true,
    },
    brand: {
      type: String,
      enum: ['IndianOil', 'HP', 'Bharat Petroleum', 'Shell', 'Nayara', 'Jio-bp', 'Other'],
      default: 'IndianOil',
    },
    address: {
      type: String,
      required: [true, 'Please provide highway or street address'],
    },
    city: {
      type: String,
      default: 'Ahmedabad',
    },
    state: {
      type: String,
      default: 'Gujarat',
    },
    phone: {
      type: String,
      default: '',
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
    fuelTypes: {
      type: [String],
      enum: ['Petrol', 'Diesel', 'CNG', 'EV Fast Charging', 'XP95 Petrol', 'Power Diesel'],
      default: ['Petrol', 'Diesel'],
    },
    is24x7: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    facilities: {
      type: [String],
      default: ['Air & Nitrogen', 'Washroom', 'Drinking Water'],
    },
  },
  {
    timestamps: true,
  }
);

petrolPumpSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PetrolPump', petrolPumpSchema);
