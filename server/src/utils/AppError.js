/**
 * Custom application error class for consistent error handling.
 * Thrown by services, caught by errorHandler middleware.
 */
class AppError extends Error {
  constructor(message, statusCode, code = 'APP_ERROR', field = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
