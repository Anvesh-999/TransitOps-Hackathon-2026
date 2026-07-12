const { z } = require('zod');
const { DRIVER_STATUSES, LICENSE_CATEGORIES } = require('../config/constants');

const driverCreateSchema = z.object({
  name: z.string().min(1, 'Driver name is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseCategory: z.enum(LICENSE_CATEGORIES, { errorMap: () => ({ message: `License category must be one of: ${LICENSE_CATEGORIES.join(', ')}` }) }),
  licenseExpiryDate: z.string().datetime({ offset: true }).or(z.string().date()),
  contactNumber: z.string().regex(/^\d{10,15}$/, 'Contact number must be 10-15 digits'),
  safetyScore: z.number().min(0).max(100).default(100),
  userId: z.string().optional(),
});

const driverUpdateSchema = driverCreateSchema.partial();

const driverStatusSchema = z.object({
  status: z.enum(DRIVER_STATUSES, { errorMap: () => ({ message: `Status must be one of: ${DRIVER_STATUSES.join(', ')}` }) }),
});

module.exports = { driverCreateSchema, driverUpdateSchema, driverStatusSchema };
