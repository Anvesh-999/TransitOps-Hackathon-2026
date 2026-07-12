/**
 * Standard API response helpers.
 * All API responses follow: { success, data?, error?, message? }
 */

const sendSuccess = (res, data, statusCode = 200, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendCreated = (res, data, message = 'Created successfully') => {
  return sendSuccess(res, data, 201, message);
};

const sendError = (res, statusCode = 500, message = 'Internal Server Error', code = 'SERVER_ERROR', field = null) => {
  const errorObj = { code, message };
  if (field) errorObj.field = field;

  return res.status(statusCode).json({
    success: false,
    error: errorObj,
  });
};

const sendPaginated = (res, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    data,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  });
};

module.exports = { sendSuccess, sendCreated, sendError, sendPaginated };
