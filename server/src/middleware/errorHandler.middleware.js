const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Centralized error handler — catches all errors and returns standard envelope.
 * Handles: AppError, ZodError, Mongoose errors, unhandled errors.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the error server-side
  logger.error(err.stack || err.message);

  // Custom AppError
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.field && { field: err.field }),
      },
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const firstField = Object.keys(err.errors)[0];
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors[firstField].message,
        field: firstField,
      },
    });
  }

  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid ${err.path}: ${err.value}`,
      },
    });
  }

  // Mongoose duplicate key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `Duplicate value for ${field}: "${err.keyValue[field]}"`,
        field,
      },
    });
  }

  // Unhandled error — don't leak stack trace to client
  return res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error',
    },
  });
};

module.exports = { errorHandler };
