const Review = require('../models/Review');
const Reservation = require('../models/Reservation');

const create = async (req, res) => {
    try {
        const { reservation_id, rating, comment } = req.body;

        if (!reservation_id || !rating) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const reservation = await Reservation.findById(reservation_id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

        if (reservation.user_id != req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (reservation.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Can only review completed reservations' });
        }

        const existing = await Review.findByReservation(reservation_id);
        if (existing) return res.status(409).json({ message: 'Review already exists' });

        const [review] = await Review.create({
            reservation_id, user_id: req.user.id, rating, comment
        });

        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getAll = async (req, res) => {
    try {
        const { limit } = req.query;
        const reviews = await Review.getAll(limit);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.findByUser(req.user.id);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const reply = async (req, res) => {
    try {
        const { manager_reply, reply } = req.body;
        const actualReply = manager_reply || reply;
        if (!actualReply) return res.status(400).json({ message: 'Missing reply' });

        const [updated] = await Review.managerReply(req.params.id, actualReply);
        if (!updated) return res.status(404).json({ message: 'Review not found' });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { create, getAll, getMyReviews, reply };