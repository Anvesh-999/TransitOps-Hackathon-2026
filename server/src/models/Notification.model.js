const mongoose = require('mongoose');
const { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    recipientRoles: {
      type: [String],
      required: true,
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: 'Medium',
    },
    relatedEntityType: {
      type: String,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientRoles: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

notificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
