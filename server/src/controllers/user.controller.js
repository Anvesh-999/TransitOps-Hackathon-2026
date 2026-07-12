const User = require('../models/User.model');
const Role = require('../models/Role.model');
const ActivityLog = require('../models/ActivityLog.model');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { logActivity } = require('../services/activityLog.service');
const AppError = require('../utils/AppError');

// ── Users ──
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      User.find(query).populate('role', 'name permissions').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);
    sendPaginated(res, data, total, page, limit);
  } catch (error) { next(error); }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const roleDoc = await Role.findById(role);
    if (!roleDoc) throw new AppError('Invalid role', 400, 'VALIDATION_ERROR');

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new AppError('Email already registered', 409, 'DUPLICATE_KEY');

    const user = new User({ name, email, passwordHash: password, role, phone });
    await user.save();

    await logActivity({ userId: req.user.id, action: 'user.create', entityType: 'User', entityId: user._id, currentValue: { name, email, role: roleDoc.name } });

    // Populate role before returning
    await user.populate('role', 'name');
    sendCreated(res, user, 'User created successfully');
  } catch (error) { next(error); }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const previousValue = { name: user.name, role: user.role, status: user.status };

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.role) {
      const roleDoc = await Role.findById(req.body.role);
      if (!roleDoc) throw new AppError('Invalid role', 400, 'VALIDATION_ERROR');
      user.role = req.body.role;
    }
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.status) user.status = req.body.status;

    await user.save();
    await user.populate('role', 'name');

    await logActivity({ userId: req.user.id, action: 'user.update', entityType: 'User', entityId: user._id, previousValue, currentValue: { name: user.name, role: user.role, status: user.status } });

    sendSuccess(res, user, 200, 'User updated');
  } catch (error) { next(error); }
};

/**
 * Reset password (Admin only) — sets a new password for a user.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    user.passwordHash = newPassword; // pre-save hook hashes it
    await user.save();

    await logActivity({ userId: req.user.id, action: 'user.resetPassword', entityType: 'User', entityId: user._id, currentValue: { resetBy: req.user.id } });

    sendSuccess(res, null, 200, 'Password reset successfully');
  } catch (error) { next(error); }
};

/**
 * Get all roles (for dropdown in user create form).
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().select('name permissions');
    sendSuccess(res, roles);
  } catch (error) { next(error); }
};

// ── Activity Logs ──
const getActivityLogs = async (req, res, next) => {
  try {
    const { entityType, entityId, userId, page = 1, limit = 25, start, end } = req.query;
    const query = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (userId) query.userId = userId;
    if (start || end) {
      query.timestamp = {};
      if (start) query.timestamp.$gte = new Date(start);
      if (end) query.timestamp.$lte = new Date(end);
    }

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

module.exports = { getUsers, createUser, updateUser, resetPassword, getRoles, getActivityLogs, getSettings, updateSettings };
