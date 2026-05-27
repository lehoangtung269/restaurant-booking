const db = require('../config/database');

const Category = {
    getAll: () => db('categories').select('*'),
    findById: (id) => db('categories').where({ id }).first(),
    findByCode: (code) => db('categories').where({ code }).first(),
    create: (data) => db('categories').insert(data).returning('*'),
    update: (id, data) => db('categories').where({ id }).update(data).returning('*'),
    delete: (id) => db('categories').where({ id }).del()
};

module.exports = Category;