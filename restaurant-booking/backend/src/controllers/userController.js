const db = require('../config/database');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Reservation = require('../models/Reservation');

// ─── CREATE USER ─────────────────────────────────────────────────────────────
// POST /api/users — body: { full_name, email, password, phone, role }
const create = async (req, res) => {
    try {
        const { full_name, email, password, phone, role = 'STAFF' } = req.body;
        const validRoles = ['CUSTOMER', 'STAFF', 'MANAGER'];

        if (!full_name || !email || !password) {
            return res.status(400).json({ message: 'full_name, email and password are required' });
        }
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'role must be CUSTOMER, STAFF or MANAGER' });
        }

        const existing = await User.findByEmail(email);
        if (existing) return res.status(409).json({ message: 'Email already exists' });

        const password_hash = await bcrypt.hash(password, 10);
        const [user] = await User.create({ full_name, email, password_hash, phone, role });

        res.status(201).json({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active,
            created_date: user.created_date,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
// GET /api/users?role=STAFF|CUSTOMER|MANAGER
const getAll = async (req, res) => {
    try {
        const { role } = req.query;

        const query = db('users')
            .select('id', 'full_name', 'email', 'phone', 'role', 'is_active', 'created_date')
            .orderBy('created_date', 'desc');

        if (role) {
            const validRoles = ['CUSTOMER', 'STAFF', 'MANAGER'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ message: 'role must be CUSTOMER, STAFF or MANAGER' });
            }
            query.where('role', role);
        }

        const users = await query;
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── GET USER BY ID ───────────────────────────────────────────────────────────
// GET /api/users/:id
const getById = async (req, res) => {
    try {
        const user = await db('users')
            .where('id', req.params.id)
            .select('id', 'full_name', 'email', 'phone', 'role', 'is_active', 'created_date', 'modified_date')
            .first();

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── UPDATE ROLE ──────────────────────────────────────────────────────────────
// PATCH /api/users/:id/role  — body: { role: "STAFF"|"CUSTOMER"|"MANAGER" }
const updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['CUSTOMER', 'STAFF', 'MANAGER'];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ message: 'role must be CUSTOMER, STAFF or MANAGER' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Không cho tự đổi role của chính mình
        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        const [updated] = await db('users')
            .where('id', req.params.id)
            .update({ role, modified_date: db.fn.now() })
            .returning(['id', 'full_name', 'email', 'role', 'is_active']);

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────────
// PATCH /api/users/:id/active  — body: { is_active: true|false }
const updateActive = async (req, res) => {
    try {
        const { is_active } = req.body;
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ message: 'is_active must be a boolean' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'Cannot deactivate your own account' });
        }

        const [updated] = await db('users')
            .where('id', req.params.id)
            .update({ is_active, modified_date: db.fn.now() })
            .returning(['id', 'full_name', 'email', 'role', 'is_active']);

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── GET USER'S RESERVATION HISTORY ──────────────────────────────────────────
// GET /api/users/:id/reservations
const getUserReservations = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const reservations = await Reservation.findByUser(req.params.id);
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { create, getAll, getById, updateRole, updateActive, getUserReservations };
