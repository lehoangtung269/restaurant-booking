const db = require('../config/database');
const Reservation = require('../models/Reservation');

/**
 * Tính end_time = start_time + 2 tiếng (format HH:MM:SS)
 * @param {string} startTime - "HH:MM" hoặc "HH:MM:SS"
 * @returns {string} - "HH:MM:SS"
 */
const calcEndTime = (startTime) => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + 120; // +2h
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
};

/**
 * Kiểm tra availability và tạo reservation trong một transaction.
 * Dùng SELECT FOR UPDATE để lock các row xung đột, ngăn race condition.
 *
 * @param {Object} data
 * @param {number} data.user_id
 * @param {number} data.table_id
 * @param {string} data.reservation_date  - "YYYY-MM-DD"
 * @param {string} data.start_time        - "HH:MM" hoặc "HH:MM:SS"
 * @param {string} [data.end_time]        - tuỳ chọn, nếu không có thì tự tính +2h
 * @param {number} data.guest_count
 * @param {string} [data.special_notes]

 * @returns {Promise<Object>} reservation vừa tạo
 * @throws {Error} nếu bàn không available
 */
const checkAndBook = async (data) => {
    const {
        user_id,
        table_id,
        reservation_date,
        start_time,
        guest_count,
        special_notes,
    } = data;

    const end_time = data.end_time || calcEndTime(start_time);

    return db.transaction(async (trx) => {
        // 1. Lock + kiểm tra conflict
        const conflict = await Reservation.findConflicting(
            trx, table_id, reservation_date, start_time, end_time
        );

        if (conflict) {
            throw Object.assign(new Error('Table not available for the requested time slot'), {
                statusCode: 409,
            });
        }

        // 2. Insert reservation
        const [reservation] = await Reservation.create(trx, {
            user_id,
            table_id,
            reservation_date,
            start_time,
            end_time,
            guest_count,
            special_notes: special_notes || null,
            status: 'CONFIRMED',
        });

        return reservation;
    });
};

module.exports = { checkAndBook, calcEndTime };
