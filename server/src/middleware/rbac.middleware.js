const AppError = require('../utils/AppError');

/**
 * RBAC middleware factory — checks if the user has the required permission.
 * Usage: requirePermission('vehicles:create')
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'AUTH_ERROR'));
    }

    const hasPermission = requiredPermissions.some((perm) =>
      req.user.permissions.includes(perm)
    );

    if (!hasPermission) {
      return next(
        new AppError('Insufficient permissions.', 403, 'FORBIDDEN')
      );
    }

    next();
  };
};

/**
 * Role-based access — checks if user has one of the allowed roles.
 * Usage: requireRole('Admin', 'FleetManager')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'AUTH_ERROR'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('Insufficient permissions.', 403, 'FORBIDDEN')
      );
    }

    next();
  };
};

module.exports = { requirePermission, requireRole };
