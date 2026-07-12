const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRY, JWT_REFRESH_EXPIRY } = require('../config/env');
const AppError = require('../utils/AppError');
const { logActivity } = require('./activityLog.service');

/**
 * Login — validates credentials, returns JWT tokens.
 */
const login = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash').populate('role');

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'AUTH_ERROR');
  }

  if (user.status === 'disabled') {
    throw new AppError('Account is disabled. Contact admin.', 403, 'ACCOUNT_DISABLED');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401, 'AUTH_ERROR');
  }

  const tokenPayload = {
    id: user._id,
    role: user.role.name,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  const refreshToken = jwt.sign(tokenPayload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });

  // Log login event
  await logActivity({
    userId: user._id,
    action: 'user.login',
    entityType: 'User',
    entityId: user._id,
    currentValue: { email: user.email, role: user.role.name },
  });

  return {
    token,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions,
    },
  };
};

/**
 * Refresh — issues a new access token from a valid refresh token.
 */
const refresh = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).populate('role');

    if (!user || user.status === 'disabled') {
      throw new AppError('Invalid refresh token', 401, 'AUTH_ERROR');
    }

    const token = jwt.sign({ id: user._id, role: user.role.name }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return { token };
  } catch (error) {
    throw new AppError('Invalid refresh token', 401, 'AUTH_ERROR');
  }
};

/**
 * Get current user profile.
 */
const getMe = async (userId) => {
  const user = await User.findById(userId).populate('role');
  if (!user) throw new AppError('User not found', 404);
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions,
    phone: user.phone,
  };
};

module.exports = { login, refresh, getMe };
