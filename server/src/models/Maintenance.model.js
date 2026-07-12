const mongoose = require('mongoose');
const { MAINTENANCE_TYPES, MAINTENANCE_STATUSES } = require('../config/constants');

const maintenanceSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
      index: true,
    },
    type: {
      type: String,
      enum: MAINTENANCE_TYPES,
      required: [true, 'Maintenance type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    expectedEndDate: {
      type: Date,
      required: [true, 'Expected end date is required'],
    },
    actualEndDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: MAINTENANCE_STATUSES,
      default: 'Open',
      index: true,
    },
  },
  { timestamps: true }
);

maintenanceSchema.index({ vehicleId: 1, status: 1 });

maintenanceSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
