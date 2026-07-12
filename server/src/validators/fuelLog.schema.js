const { z } = require('zod');

const fuelLogCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  tripId: z.string().optional(),
  liters: z.number().positive('Liters must be greater than 0'),
  costPerLiter: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().date()),
});

module.exports = { fuelLogCreateSchema };
