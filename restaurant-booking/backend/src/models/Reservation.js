const db = require('../config/database');

const Reservation = {
    findById: (id) =>
        db('reservations as r')
            .join('users as u', 'r.user_id', 'u.id')
            .join('restaurant_tables as t', 'r.table_id', 't.id')
            .where('r.id', id)
            .select(
                'r.*',
                'u.full_name as user_name',
                'u.email as user_email',
                'u.phone as user_phone',
                't.table_number',
                't.area',
                't.capacity'
            )
            .first(),

    findByUser: (user_id) =>
        db('reservations as r')
            .join('restaurant_tables as t', 'r.table_id', 't.id')
            .where('r.user_id', user_id)
            .select('r.*', 't.table_number', 't.area', 't.capacity')
            .orderBy('r.reservation_date', 'desc')
            .orderBy('r.start_time', 'desc'),

    getAll: (filters = {}) => {
        const query = db('reservations as r')
            .join('users as u', 'r.user_id', 'u.id')
            .join('restaurant_tables as t', 'r.table_id', 't.id')
            .select(
                'r.*',
                'u.full_name as user_name',
                'u.email as user_email',
                't.table_number',
                't.area'
            )
            .orderBy('r.reservation_date', 'desc')
            .orderBy('r.start_time', 'asc');

        if (filters.date) query.where('r.reservation_date', filters.date);
        if (filters.status) query.where('r.status', filters.status);
        if (filters.table_id) query.where('r.table_id', filters.table_id);
        if (filters.area) query.where('t.area', filters.area); // lọc theo khu vực bàn

        return query;
    },

    create: (trx, data) =>
        trx('reservations').insert(data).returning('*'),

    updateStatus: (trx, id, status, extra = {}) =>
        trx('reservations')
            .where({ id })
            .update({ status, modified_date: db.fn.now(), ...extra })
            .returning('*'),

    // Cập nhật ghi chú nhanh của Staff — APPEND vào special_notes, giữ nguyên ghi chú của khách
    // Format: "[Gốc]: <customer note> | [Staff]: <staff note>"
    updateStaffNote: async (id, staffNote) => {
        const reservation = await db('reservations').where({ id }).first();
        const existingNote = reservation.special_notes || '';
        // Nếu đã có staff note cũ thì thay thế phần [Staff]:, giữ phần khách
        const customerPart = existingNote.split(' | [Staff]:')[0];
        const newNote = staffNote
            ? `${customerPart} | [Staff]: ${staffNote}`.trim()
            : customerPart.trim();
        return db('reservations')
            .where({ id })
            .update({ special_notes: newNote, modified_date: db.fn.now() })
            .returning('*');
    },

    // Tìm reservation xung đột trong transaction với FOR UPDATE row lock
    // Overlap: existing.start_time < new.end_time AND existing.end_time > new.start_time
    findConflicting: (trx, tableId, date, startTime, endTime, excludeId = null) => {
        const query = trx('reservations')
            .where('table_id', tableId)
            .where('reservation_date', date)
            .whereIn('status', ['CONFIRMED', 'SEATED'])
            .where('start_time', '<', endTime)
            .where('end_time', '>', startTime)
            .forUpdate(); // SELECT ... FOR UPDATE — row lock

        if (excludeId) query.whereNot('id', excludeId);

        return query.first();
    },

    // Lấy các reservation CONFIRMED đã quá 30 phút so với start_time
    findNoShowCandidates: () =>
        db('reservations')
            .where('status', 'CONFIRMED')
            .whereRaw(
                "(reservation_date + start_time::interval) < NOW() - INTERVAL '30 minutes'"
            )
};

module.exports = Reservation;
