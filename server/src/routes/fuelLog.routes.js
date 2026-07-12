const router = require('express').Router();
const ctrl = require('../controllers/fuelLog.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { fuelLogCreateSchema } = require('../validators/fuelLog.schema');

router.use(authenticate);

router.get('/', requirePermission('fuel-logs:read'), ctrl.getAll);
router.post('/', requirePermission('fuel-logs:create'), validate(fuelLogCreateSchema), ctrl.create);
router.delete('/:id', requirePermission('fuel-logs:delete'), ctrl.remove);

module.exports = router;
