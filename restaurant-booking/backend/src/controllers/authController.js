const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
    return { accessToken, refreshToken };
};

const register = async (req, res) => {
    try {
        const { full_name, email, password, phone } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [user] = await User.create({
            full_name, email, password_hash, phone, role: 'CUSTOMER'
        });

        const { accessToken, refreshToken } = generateTokens(user);

        res.status(201).json({
            accessToken, refreshToken, user: {
                id: user.id, full_name: user.full_name, email: user.email, role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        if (!user.is_active) return res.status(403).json({ message: 'Account disabled' });

        const { accessToken, refreshToken } = generateTokens(user);

        res.json({
            accessToken, refreshToken, user: {
                id: user.id, full_name: user.full_name, email: user.email, role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ id: user.id, full_name: user.full_name, email: user.email, role: user.role, phone: user.phone });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { register, login, getMe };