const db = require('../config/database');

const Table = {
    getAll: () => db('restaurant_tables').select('*'),

    findById: (id) => db('restaurant_tables').where({ id }).first(),

    create: (data) => db('restaurant_tables').insert(data).returning('*'),

    update: (id, data) => db('restaurant_tables').where({ id }).update(data).returning('*'),

    delete: (id) => db('restaurant_tables').where({ id }).del(),

    // Tìm các bàn trống phù hợp với ngày, giờ, số khách và khu vực
    getAvailableTables: (date, startTime, endTime, guestCount = null, area = null) => {
        const query = db('restaurant_tables as t')
            .where('t.status', 'AVAILABLE')
            .whereNotExists(function() {
                this.select('*')
                    .from('reservations as r')
                    .whereRaw('r.table_id = t.id')
                    .where('r.reservation_date', date)
                    .whereIn('r.status', ['CONFIRMED', 'SEATED'])
                    .where('r.start_time', '<', endTime)
                    .where('r.end_time', '>', startTime);
            });

        if (guestCount) {
            query.where('t.capacity', '>=', Number(guestCount));
        }

        if (area) {
            query.where('t.area', area);
        }

        return query.orderBy('t.capacity', 'asc').orderBy('t.table_number', 'asc');
    }
};

module.exports = Table;