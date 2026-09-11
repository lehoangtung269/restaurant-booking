const Notification = require('../models/Notification');

const createNotification = async (user_id, type, title, message) => {
    try {
        const [notification] = await Notification.create({
            user_id, type, title, message
        });
        return notification;
    } catch (err) {
        console.error('Notification error:', err.message);
    }
};

const notifyBookingConfirmed = (user_id, reservationDate, startTime) => {
    return createNotification(
        user_id,
        'BOOKING_CONFIRMED',
        'Đặt bàn thành công',
        `Bàn của bạn đã được xác nhận vào lúc ${startTime} ngày ${reservationDate}`
    );
};

const notifyBookingCancelled = (user_id, reservationDate, startTime) => {
    return createNotification(
        user_id,
        'BOOKING_CANCELLED',
        'Đặt bàn đã bị hủy',
        `Đặt bàn lúc ${startTime} ngày ${reservationDate} đã bị hủy`
    );
};

const notifyReminder = (user_id, reservationDate, startTime) => {
    return createNotification(
        user_id,
        'BOOKING_REMINDER',
        'Nhắc nhở đặt bàn',
        `Bạn có đặt bàn lúc ${startTime} ngày ${reservationDate} — còn 2 tiếng nữa!`
    );
};

module.exports = { createNotification, notifyBookingConfirmed, notifyBookingCancelled, notifyReminder };