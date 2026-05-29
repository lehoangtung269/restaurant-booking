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

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.is_active) return res.status(403).json({ message: 'Account disabled' });

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;
        if (!full_name && !phone) {
            return res.status(400).json({ message: 'Provide at least full_name or phone to update' });
        }

        const updates = {};
        if (full_name) updates.full_name = full_name.trim();
        if (phone) updates.phone = phone.trim();

        const [updated] = await User.update(req.user.id, updates);
        res.json({ id: updated.id, full_name: updated.full_name, email: updated.email, phone: updated.phone, role: updated.role });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            return res.status(400).json({ message: 'current_password and new_password are required' });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ message: 'new_password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id);
        const match = await bcrypt.compare(current_password, user.password_hash);
        if (!match) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const password_hash = await bcrypt.hash(new_password, 10);
        await User.update(req.user.id, { password_hash });
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { register, login, getMe, refreshToken, updateProfile, changePassword };