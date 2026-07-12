const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { userCreateSchema, userUpdateSchema } = require('../validators/user.schema');

router.use(authenticate);

// Users (Admin only)
router.get('/users', requireRole('Admin'), ctrl.getUsers);
router.post('/users', requireRole('Admin'), validate(userCreateSchema), ctrl.createUser);
router.put('/users/:id', requireRole('Admin'), validate(userUpdateSchema), ctrl.updateUser);
router.patch('/users/:id/reset-password', requireRole('Admin'), ctrl.resetPassword);

// Roles (Admin only — for dropdowns)
router.get('/roles', requireRole('Admin'), ctrl.getRoles);

// Activity Logs (Admin + FleetManager)
router.get('/activity-logs', requireRole('Admin', 'FleetManager'), ctrl.getActivityLogs);

// Settings (Admin only)
router.get('/settings', requireRole('Admin'), ctrl.getSettings);
router.put('/settings', requireRole('Admin'), ctrl.updateSettings);

module.exports = router;
