const mongoose = require('mongoose');
const { DRIVER_STATUSES, LICENSE_CATEGORIES } = require('../config/constants');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
    },
    licenseCategory: {
      type: String,
      enum: LICENSE_CATEGORIES,
      required: [true, 'License category is required'],
    },
    licenseExpiryDate: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      match: [/^\d{10,15}$/, 'Contact number must be 10-15 digits'],
    },
    safetyScore: {
      type: Number,
      default: 100,
      min: [0, 'Safety score cannot be below 0'],
      max: [100, 'Safety score cannot exceed 100'],
    },
    status: {
      type: String,
      enum: DRIVER_STATUSES,
      default: 'Available',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

driverSchema.index({ status: 1 });
driverSchema.index({ licenseExpiryDate: 1 });

// Virtual: isLicenseExpired (computed, not stored — per PRD)
driverSchema.virtual('isLicenseExpired').get(function () {
  return this.licenseExpiryDate < new Date();
});

// Virtual: isLicenseExpiringSoon (within 30 days)
driverSchema.virtual('isLicenseExpiringSoon').get(function () {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.licenseExpiryDate <= thirtyDaysFromNow && !this.isLicenseExpired;
});

driverSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

driverSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Driver', driverSchema);
