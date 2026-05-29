const express = require('express');
const router = express.Router();
const { register, login, getMe, refreshToken, updateProfile, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');
const { validateRegister, validateLogin, validateRefreshToken } = require('../middlewares/validate');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', validateRefreshToken, refreshToken);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.patch('/change-password', verifyToken, changePassword);

module.exports = router;