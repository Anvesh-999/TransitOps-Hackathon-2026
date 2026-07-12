const mongoose = require('mongoose');
const { ENTITY_TYPES } = require('../config/constants');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true, // e.g. 'vehicle.create', 'trip.dispatch'
  },
  entityType: {
    type: String,
    enum: ENTITY_TYPES,
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  currentValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ userId: 1 });

activityLogSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
