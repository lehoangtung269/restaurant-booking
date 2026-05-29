const db = require('../config/database');

const Notification = {
    findByUser: (user_id) =>
        db('notifications')
            .where({ user_id })
            .orderBy('created_date', 'desc'),

    create: (data) => db('notifications').insert(data).returning('*'),

    markAsRead: (id, user_id) =>
        db('notifications')
            .where({ id, user_id })
            .update({ is_read: true })
            .returning('*'),

    markAllAsRead: (user_id) =>
        db('notifications')
            .where({ user_id, is_read: false })
            .update({ is_read: true }),

    getUnreadCount: (user_id) =>
        db('notifications')
            .where({ user_id, is_read: false })
            .count('id as count')
            .first()
};

module.exports = Notification;