const Notification = require('../models/Notification.model');

/**
 * Creates an in-app notification.
 */
const createNotification = async ({ type, recipientRoles, recipientUserId, message, priority, relatedEntityType, relatedEntityId }) => {
  try {
    return await Notification.create({
      type,
      recipientRoles,
      recipientUserId: recipientUserId || null,
      message,
      priority: priority || 'Medium',
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null,
    });
  } catch (error) {
    console.error('Notification creation failed:', error.message);
  }
};

/**
 * Get notifications for a user's role, paginated.
 */
const getNotifications = async (userRole, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const filter = { recipientRoles: userRole };

  const [data, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  return { data, total, unreadCount, page, limit };
};

/**
 * Mark a notification as read.
 */
const markAsRead = async (notificationId) => {
  return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
};

/**
 * Mark all notifications for a role as read.
 */
const markAllAsRead = async (userRole) => {
  return Notification.updateMany({ recipientRoles: userRole, isRead: false }, { isRead: true });
};

/**
 * Check for drivers with licenses expiring within 30 days and create notifications.
 */
const checkLicenseExpiry = async () => {
  const Driver = require('../models/Driver.model');
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringDrivers = await Driver.find({
    licenseExpiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
    status: { $ne: 'Suspended' },
  });

  for (const driver of expiringDrivers) {
    const daysUntilExpiry = Math.ceil((driver.licenseExpiryDate - new Date()) / (1000 * 60 * 60 * 24));
    const priority = daysUntilExpiry <= 7 ? 'High' : 'Medium';

    // Avoid duplicate notifications (check if one exists in last 24h)
    const existing = await Notification.findOne({
      type: 'license_expiry_warning',
      relatedEntityId: driver._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (!existing) {
      await createNotification({
        type: 'license_expiry_warning',
        recipientRoles: ['SafetyOfficer', 'Admin'],
        message: `Driver ${driver.name}'s license expires in ${daysUntilExpiry} days (${driver.licenseExpiryDate.toISOString().split('T')[0]})`,
        priority,
        relatedEntityType: 'Driver',
        relatedEntityId: driver._id,
      });
    }
  }
};

module.exports = { createNotification, getNotifications, markAsRead, markAllAsRead, checkLicenseExpiry };
