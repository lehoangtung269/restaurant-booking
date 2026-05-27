const db = require('../config/database');

const Table = {
    getAll: () => db('restaurant_tables').select('*'),

    findById: (id) => db('restaurant_tables').where({ id }).first(),

    create: (data) => db('restaurant_tables').insert(data).returning('*'),

    update: (id, data) => db('restaurant_tables').where({ id }).update(data).returning('*'),

    delete: (id) => db('restaurant_tables').where({ id }).del()
};

module.exports = Table;