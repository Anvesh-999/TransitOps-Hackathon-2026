const notificationService = require('../services/notification.service');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await notificationService.getNotifications(req.user.role, Number(page), Number(limit));
    res.status(200).json({ success: true, data: result.data, total: result.total, unreadCount: result.unreadCount, page: result.page, limit: result.limit });
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    sendSuccess(res, notification, 200, 'Notification marked as read');
  } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.role);
    sendSuccess(res, null, 200, 'All notifications marked as read');
  } catch (error) { next(error); }
};

module.exports = { getAll, markAsRead, markAllAsRead };
