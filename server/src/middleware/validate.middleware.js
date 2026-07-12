const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

/**
 * Validation middleware factory — wraps Zod schema.parse().
 * Validates req.body by default, or specify 'query'/'params'.
 * Usage: validate(vehicleCreateSchema) or validate(schema, 'query')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // replace with parsed (coerced/stripped) values
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        return next(
          new AppError(
            firstError.message,
            400,
            'VALIDATION_ERROR',
            firstError.path.join('.')
          )
        );
      }
      next(error);
    }
  };
};

module.exports = { validate };
