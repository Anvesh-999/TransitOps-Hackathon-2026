const { z } = require('zod');
const { MAINTENANCE_TYPES } = require('../config/constants');

const maintenanceCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  type: z.enum(MAINTENANCE_TYPES, { errorMap: () => ({ message: `Type must be one of: ${MAINTENANCE_TYPES.join(', ')}` }) }),
  description: z.string().min(1, 'Description is required'),
  cost: z.coerce.number().min(0, 'Cost cannot be negative'),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()),
  expectedEndDate: z.string().datetime({ offset: true }).or(z.string().date()),
});

const maintenanceUpdateSchema = maintenanceCreateSchema.partial();

const maintenanceCloseSchema = z.object({
  actualEndDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
});

module.exports = { maintenanceCreateSchema, maintenanceUpdateSchema, maintenanceCloseSchema };
