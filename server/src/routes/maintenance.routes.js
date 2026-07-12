const router = require('express').Router();
const ctrl = require('../controllers/maintenance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { maintenanceCreateSchema, maintenanceUpdateSchema, maintenanceCloseSchema } = require('../validators/maintenance.schema');

router.use(authenticate);

router.get('/', requirePermission('maintenance:read'), ctrl.getAll);
router.get('/:id', requirePermission('maintenance:read'), ctrl.getById);
router.post('/', requirePermission('maintenance:create'), validate(maintenanceCreateSchema), ctrl.create);
router.put('/:id', requirePermission('maintenance:update'), validate(maintenanceUpdateSchema), ctrl.update);
router.patch('/:id/close', requirePermission('maintenance:update'), validate(maintenanceCloseSchema), ctrl.close);

module.exports = router;
