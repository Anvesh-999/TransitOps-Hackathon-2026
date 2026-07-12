const router = require('express').Router();
const ctrl = require('../controllers/trip.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { tripCreateSchema, tripCompleteSchema, tripCancelSchema } = require('../validators/trip.schema');

router.use(authenticate);

router.get('/', requirePermission('trips:read'), ctrl.getAll);
router.get('/:id', requirePermission('trips:read'), ctrl.getById);
router.post('/', requirePermission('trips:create'), validate(tripCreateSchema), ctrl.create);
router.patch('/:id/dispatch', requirePermission('trips:update'), ctrl.dispatch);
router.patch('/:id/complete', requirePermission('trips:update'), validate(tripCompleteSchema), ctrl.complete);
router.patch('/:id/cancel', requirePermission('trips:update'), validate(tripCancelSchema), ctrl.cancel);

module.exports = router;
