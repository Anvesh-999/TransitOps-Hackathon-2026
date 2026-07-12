const { z } = require('zod');
const { EXPENSE_CATEGORIES } = require('../config/constants');

const expenseCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  category: z.enum(EXPENSE_CATEGORIES, { errorMap: () => ({ message: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}` }) }),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().datetime({ offset: true }).or(z.string().date()),
  notes: z.string().optional(),
});

module.exports = { expenseCreateSchema };
