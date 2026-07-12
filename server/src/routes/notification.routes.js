const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', requirePermission('notifications:read'), ctrl.getAll);
router.patch('/mark-all-read', requirePermission('notifications:read'), ctrl.markAllAsRead);
router.patch('/:id/read', requirePermission('notifications:read'), ctrl.markAsRead);

module.exports = router;
