const { z } = require('zod');
const { VEHICLE_TYPES, VEHICLE_STATUSES } = require('../config/constants');

const vehicleCreateSchema = z.object({
  registrationNumber: z
    .string()
    .min(4, 'Registration number must be at least 4 characters')
    .max(15, 'Registration number must be at most 15 characters')
    .regex(/^[A-Z0-9]+$/, 'Must be uppercase alphanumeric')
    .transform((val) => val.toUpperCase()),
  name: z.string().min(1, 'Vehicle name is required'),
  type: z.enum(VEHICLE_TYPES, { errorMap: () => ({ message: `Type must be one of: ${VEHICLE_TYPES.join(', ')}` }) }),
  maxLoadCapacityKg: z.coerce.number().positive('Capacity must be greater than 0'),
  odometerKm: z.coerce.number().min(0, 'Odometer cannot be negative').default(0),
  acquisitionCost: z.coerce.number().min(0, 'Acquisition cost cannot be negative'),
  region: z.string().optional(),
});

const vehicleUpdateSchema = vehicleCreateSchema.partial();

const vehicleStatusSchema = z.object({
  status: z.enum(VEHICLE_STATUSES, { errorMap: () => ({ message: `Status must be one of: ${VEHICLE_STATUSES.join(', ')}` }) }),
});

module.exports = { vehicleCreateSchema, vehicleUpdateSchema, vehicleStatusSchema };
