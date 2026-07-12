const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User.model');
const AppError = require('../utils/AppError');

/**
 * Auth middleware — verifies JWT, attaches req.user with role & permissions.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401, 'AUTH_ERROR');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).populate('role');
    if (!user) {
      throw new AppError('User not found.', 401, 'AUTH_ERROR');
    }

    if (user.status === 'disabled') {
      throw new AppError('Account is disabled. Contact admin.', 403, 'ACCOUNT_DISABLED');
    }

    // Attach user info to request
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401, 'AUTH_ERROR'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired.', 401, 'TOKEN_EXPIRED'));
    }
    next(error);
  }
};

module.exports = { authenticate };
