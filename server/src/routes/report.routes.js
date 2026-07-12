const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/:type', requirePermission('reports:read'), ctrl.getReport);
router.get('/:type/export', requirePermission('reports:export'), ctrl.exportReport);

module.exports = router;
