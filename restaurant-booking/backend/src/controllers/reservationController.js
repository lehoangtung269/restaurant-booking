const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const User = require('../models/User');
const availabilityService = require('../services/availabilityService');
const { notifyBookingConfirmed, notifyBookingCancelled } = require('../services/notificationService');
const { sendBookingConfirmation, sendBookingCancellation } = require('../services/emailService');

// Các chuyển trạng thái hợp lệ (chỉ STAFF/MANAGER)
const VALID_TRANSITIONS = {
    CONFIRMED: ['SEATED', 'CANCELLED', 'NO_SHOW'],
    SEATED: ['COMPLETED', 'CANCELLED'],
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
const create = async (req, res) => {
    try {
        const { table_id, reservation_date, start_time, end_time, guest_count, special_notes } = req.body;

        if (!table_id || !reservation_date || !start_time || !guest_count) {
            return res.status(400).json({ message: 'Missing required fields: table_id, reservation_date, start_time, guest_count' });
        }

        // Kiểm tra bàn tồn tại và không bị maintenance
        const table = await Table.findById(table_id);
        if (!table) return res.status(404).json({ message: 'Table not found' });
        if (table.status === 'MAINTENANCE') {
            return res.status(400).json({ message: 'Table is under maintenance' });
        }
        if (guest_count > table.capacity) {
            return res.status(400).json({ message: `Table capacity is ${table.capacity}, but guest_count is ${guest_count}` });
        }

        const reservation = await availabilityService.checkAndBook({
            user_id: req.user.id,
            table_id,
            reservation_date,
            start_time,
            end_time,
            guest_count,
            special_notes,
        });

        res.status(201).json(reservation);

        // ✅ Gửi email + notification sau khi response đã trả về (fire-and-forget)
        const user = await User.findById(req.user.id);
        await sendBookingConfirmation(
            user.email,
            user.full_name,
            reservation.reservation_date,
            reservation.start_time,
            table.table_number
        );
        await notifyBookingConfirmed(req.user.id, reservation.reservation_date, reservation.start_time);

    } catch (err) {
        const status = err.statusCode || 500;
        res.status(status).json({ message: err.message });
    }
};

// ─── GET MY RESERVATIONS ──────────────────────────────────────────────────────
const getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.findByUser(req.user.id);
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── GET ALL (STAFF / MANAGER) ────────────────────────────────────────────────
const getAll = async (req, res) => {
    try {
        const { date, status, table_id } = req.query;
        const reservations = await Reservation.getAll({ date, status, table_id });
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
const getById = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

        // Customer chỉ xem được của chính mình
        if (req.user.role === 'CUSTOMER' && reservation.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        res.json(reservation);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── UPDATE STATUS (STAFF / MANAGER — state machine) ─────────────────────────
const updateStatus = async (req, res) => {
    try {
        const { status: newStatus } = req.body;
        if (!newStatus) return res.status(400).json({ message: 'Missing status' });

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

        const allowedNext = VALID_TRANSITIONS[reservation.status];
        if (!allowedNext || !allowedNext.includes(newStatus)) {
            return res.status(400).json({
                message: `Invalid transition: ${reservation.status} → ${newStatus}`,
                allowed: allowedNext || [],
            });
        }

        const extra = {};
        if (newStatus === 'CANCELLED') {
            extra.cancelled_by = req.user.id;
            extra.cancelled_at = new Date();
        }

        const db = require('../config/database');
        const [updated] = await Reservation.updateStatus(db, req.params.id, newStatus, extra);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── CANCEL (CUSTOMER — với deadline 2 tiếng) ────────────────────────────────
const cancel = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

        // Chỉ chủ reservation mới được huỷ
        if (reservation.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Chỉ huỷ được khi đang CONFIRMED
        if (reservation.status !== 'CONFIRMED') {
            return res.status(400).json({ message: 'Cannot cancel this reservation' });
        }

        // Kiểm tra deadline: phải huỷ trước start_time ít nhất 2 tiếng
        const startDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
        const deadline = new Date(startDateTime.getTime() - 2 * 60 * 60 * 1000); // -2h
        if (new Date() >= deadline) {
            return res.status(400).json({
                message: 'Cancellation deadline passed. You must cancel at least 2 hours before the reservation.',
            });
        }

        const db = require('../config/database');
        const [updated] = await Reservation.updateStatus(db, req.params.id, 'CANCELLED', {
            cancelled_by: req.user.id,
            cancelled_at: new Date(),
        });

        res.json({ message: 'Reservation cancelled successfully', reservation: updated });

        // ✅ Gửi email + notification sau khi response đã trả về (fire-and-forget)
        const user = await User.findById(reservation.user_id);
        await sendBookingCancellation(
            user.email,
            user.full_name,
            reservation.reservation_date,
            reservation.start_time
        );
        await notifyBookingCancelled(reservation.user_id, reservation.reservation_date, reservation.start_time);

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { create, getMyReservations, getAll, getById, updateStatus, cancel };
