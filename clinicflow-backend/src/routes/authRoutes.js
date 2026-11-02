const router = require('express').Router();
const { login, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate, loginSchema } = require('../middleware/validate');

router.post('/login', validate(loginSchema), login);
router.get('/me', authenticateToken, getMe);

module.exports = router;