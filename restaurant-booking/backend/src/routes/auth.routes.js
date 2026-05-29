const express = require('express');
const router = express.Router();
const { register, login, getMe, refreshToken } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const { validateRegister, validateLogin, validateRefreshToken } = require('../middlewares/validate');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', validateRefreshToken, refreshToken);
router.get('/me', verifyToken, getMe);

module.exports = router;