const { z } = require('zod');

const tripCreateSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  cargoWeightKg: z.number().positive('Cargo weight must be greater than 0'),
  plannedDistanceKm: z.number().positive('Distance must be greater than 0'),
  revenue: z.number().min(0).default(0),
});

const tripCompleteSchema = z.object({
  finalOdometerKm: z.number().positive('Final odometer must be positive'),
  fuelConsumedLiters: z.number().min(0, 'Fuel consumed cannot be negative').optional(),
});

const tripCancelSchema = z.object({
  reason: z.string().optional(),
});

module.exports = { tripCreateSchema, tripCompleteSchema, tripCancelSchema };
