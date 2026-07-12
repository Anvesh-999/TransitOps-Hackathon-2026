const { z } = require('zod');
const { ROLE_LIST } = require('../config/constants');

const userCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1, 'Role is required'), // Role ObjectId
  phone: z.string().optional(),
});

const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'disabled']).optional(),
});

module.exports = { userCreateSchema, userUpdateSchema };
