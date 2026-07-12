const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { loginSchema, refreshSchema } = require('../validators/auth.schema');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

router.post('/login', authLimiter, validate(loginSchema), authCtrl.login);
router.post('/logout', authenticate, authCtrl.logout);
router.post('/refresh', validate(refreshSchema), authCtrl.refresh);
router.get('/me', authenticate, authCtrl.getMe);

module.exports = router;
