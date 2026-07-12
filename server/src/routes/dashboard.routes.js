const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.use(requirePermission('dashboard:read'));

router.get('/kpis', ctrl.getKpis);
router.get('/charts', ctrl.getCharts);
router.get('/recent-activity', ctrl.getRecentActivity);

module.exports = router;
