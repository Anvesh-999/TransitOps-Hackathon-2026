const User = require('../models/User.model');
const Role = require('../models/Role.model');
const ActivityLog = require('../models/ActivityLog.model');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { logActivity } = require('../services/activityLog.service');
const AppError = require('../utils/AppError');

// ── Users ──
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      User.find().populate('role', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(),
    ]);
    sendPaginated(res, data, total, page, limit);
  } catch (error) { next(error); }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const roleDoc = await Role.findById(role);
    if (!roleDoc) throw new AppError('Invalid role', 400, 'VALIDATION_ERROR');

    const user = new User({ name, email, passwordHash: password, role, phone });
    await user.save();

    await logActivity({ userId: req.user.id, action: 'user.create', entityType: 'User', entityId: user._id, currentValue: { name, email, role: roleDoc.name } });

    sendCreated(res, user, 'User created successfully');
  } catch (error) { next(error); }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const previousValue = { role: user.role, status: user.status };

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.role) user.role = req.body.role;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.status) user.status = req.body.status;

    await user.save();

    await logActivity({ userId: req.user.id, action: 'user.update', entityType: 'User', entityId: user._id, previousValue, currentValue: { role: user.role, status: user.status } });

    sendSuccess(res, user, 200, 'User updated');
  } catch (error) { next(error); }
};

// ── Activity Logs ──
const getActivityLogs = async (req, res, next) => {
  try {
    const { entityType, entityId, userId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (userId) query.userId = userId;

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      ActivityLog.find(query).populate('userId', 'name email').sort({ timestamp: -1 }).skip(skip).limit(Number(limit)),
      ActivityLog.countDocuments(query),
    ]);
    sendPaginated(res, data, total, page, limit);
  } catch (error) { next(error); }
};

// ── Settings ──
const getSettings = async (req, res) => {
  sendSuccess(res, { orgName: 'TransitOps', timezone: 'Asia/Kolkata' });
};

const updateSettings = async (req, res) => {
  sendSuccess(res, req.body, 200, 'Settings updated');
};

module.exports = { getUsers, createUser, updateUser, getActivityLogs, getSettings, updateSettings };
