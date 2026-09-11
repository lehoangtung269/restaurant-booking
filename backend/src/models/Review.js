const db = require('../config/database');

const Review = {
    findByReservation: (reservation_id) =>
        db('reviews').where({ reservation_id }).first(),

    findByUser: (user_id) =>
        db('reviews').where({ user_id }).orderBy('created_date', 'desc'),

    getAll: (limit = null) => {
        const query = db('reviews')
            .join('users', 'reviews.user_id', 'users.id')
            .join('reservations', 'reviews.reservation_id', 'reservations.id')
            .select(
                'reviews.*',
                'users.full_name as customer_name',
                'reservations.reservation_date'
            )
            .orderBy('reviews.created_date', 'desc');
        if (limit) query.limit(Number(limit));
        return query;
    },

    create: (data) => db('reviews').insert(data).returning('*'),

    managerReply: (id, manager_reply) =>
        db('reviews').where({ id }).update({ manager_reply }).returning('*')
};

module.exports = Review;