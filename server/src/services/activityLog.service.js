const ActivityLog = require('../models/ActivityLog.model');

/**
 * Audit-write helper — creates an ActivityLog entry.
 * Called from all services on state-changing actions.
 */
const logActivity = async ({ userId, action, entityType, entityId, previousValue, currentValue }) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      previousValue: previousValue || null,
      currentValue: currentValue || null,
      timestamp: new Date(),
    });
  } catch (error) {
    // Activity logging should never break the main flow
    console.error('ActivityLog write failed:', error.message);
  }
};

module.exports = { logActivity };
