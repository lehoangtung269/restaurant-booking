const db = require('../config/database');

const User = {
    findByEmail: (email) => db('users').where({ email }).first(),

    findById: (id) => db('users').where({ id }).first(),

    create: (data) => db('users').insert(data).returning('*'),

    update: (id, data) => db('users').where({ id }).update(data).returning('*')
};

module.exports = User;