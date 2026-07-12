const router = require('express').Router();
const ctrl = require('../controllers/expense.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { expenseCreateSchema } = require('../validators/expense.schema');

router.use(authenticate);

router.get('/', requirePermission('expenses:read'), ctrl.getAll);
router.post('/', requirePermission('expenses:create'), validate(expenseCreateSchema), ctrl.create);
router.delete('/:id', requirePermission('expenses:delete'), ctrl.remove);

module.exports = router;
