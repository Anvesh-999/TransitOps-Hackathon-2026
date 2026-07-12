const router = require('express').Router();
const ctrl = require('../controllers/vehicle.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { vehicleCreateSchema, vehicleUpdateSchema, vehicleStatusSchema } = require('../validators/vehicle.schema');

router.use(authenticate);

router.get('/', requirePermission('vehicles:read'), ctrl.getAll);
router.get('/:id', requirePermission('vehicles:read'), ctrl.getById);
router.post('/', requirePermission('vehicles:create'), validate(vehicleCreateSchema), ctrl.create);
router.put('/:id', requirePermission('vehicles:update'), validate(vehicleUpdateSchema), ctrl.update);
router.delete('/:id', requirePermission('vehicles:delete'), ctrl.remove);
router.patch('/:id/status', requirePermission('vehicles:update'), validate(vehicleStatusSchema), ctrl.updateStatus);

module.exports = router;
