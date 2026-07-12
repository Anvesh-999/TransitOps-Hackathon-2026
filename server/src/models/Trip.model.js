const mongoose = require('mongoose');
const { TRIP_STATUSES } = require('../config/constants');

const tripSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: [true, 'Source is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver is required'],
      index: true,
    },
    cargoWeightKg: {
      type: Number,
      required: [true, 'Cargo weight is required'],
      min: [0.01, 'Cargo weight must be greater than 0'],
    },
    plannedDistanceKm: {
      type: Number,
      required: [true, 'Planned distance is required'],
      min: [0.01, 'Distance must be greater than 0'],
    },
    actualDistanceKm: {
      type: Number,
    },
    finalOdometerKm: {
      type: Number,
    },
    fuelConsumedLiters: {
      type: Number,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: TRIP_STATUSES,
      default: 'Draft',
      index: true,
    },
    dispatchedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

tripSchema.index({ status: 1 });
tripSchema.index({ vehicleId: 1 });
tripSchema.index({ driverId: 1 });
tripSchema.index({ createdAt: -1 });

tripSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Trip', tripSchema);
