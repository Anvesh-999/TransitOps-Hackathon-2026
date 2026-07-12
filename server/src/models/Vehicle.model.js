const mongoose = require('mongoose');
const { VEHICLE_TYPES, VEHICLE_STATUSES } = require('../config/constants');

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{4,15}$/, 'Registration number must be 4-15 uppercase alphanumeric characters'],
    },
    name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: VEHICLE_TYPES,
      required: [true, 'Vehicle type is required'],
    },
    maxLoadCapacityKg: {
      type: Number,
      required: [true, 'Max load capacity is required'],
      min: [0.01, 'Capacity must be greater than 0'],
    },
    odometerKm: {
      type: Number,
      default: 0,
      min: [0, 'Odometer cannot be negative'],
    },
    acquisitionCost: {
      type: Number,
      required: [true, 'Acquisition cost is required'],
      min: [0, 'Acquisition cost cannot be negative'],
    },
    status: {
      type: String,
      enum: VEHICLE_STATUSES,
      default: 'Available',
    },
    region: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

vehicleSchema.index({ status: 1, type: 1 });

vehicleSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
