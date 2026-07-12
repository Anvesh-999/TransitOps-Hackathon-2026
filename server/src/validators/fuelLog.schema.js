const { z } = require('zod');

const fuelLogCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  tripId: z.string().optional(),
  liters: z.coerce.number().positive('Liters must be greater than 0'),
  costPerLiter: z.coerce.number().min(0).optional(),
  totalCost: z.coerce.number().min(0).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().date()),
});

module.exports = { fuelLogCreateSchema };
