const router = require('express').Router();
const ctrl = require('../controllers/driver.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { driverCreateSchema, driverUpdateSchema, driverStatusSchema } = require('../validators/driver.schema');

router.use(authenticate);

router.get('/', requirePermission('drivers:read'), ctrl.getAll);
router.get('/:id', requirePermission('drivers:read'), ctrl.getById);
router.post('/', requirePermission('drivers:create'), validate(driverCreateSchema), ctrl.create);
router.put('/:id', requirePermission('drivers:update'), validate(driverUpdateSchema), ctrl.update);
router.delete('/:id', requirePermission('drivers:delete'), ctrl.remove);
router.patch('/:id/status', requirePermission('drivers:update'), validate(driverStatusSchema), ctrl.updateStatus);

module.exports = router;
