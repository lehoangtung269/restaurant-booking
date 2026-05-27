const db = require('../config/database');

const MenuItem = {
    getAll: () => db('menu_items').join('categories', 'menu_items.category_id', 'categories.id')
        .select('menu_items.*', 'categories.name as category_name'),

    findById: (id) => db('menu_items').where({ 'menu_items.id': id }).first(),

    getByCategory: (category_id) => db('menu_items').where({ category_id }).select('*'),

    create: (data) => db('menu_items').insert(data).returning('*'),

    update: (id, data) => db('menu_items').where({ id }).update(data).returning('*'),

    delete: (id) => db('menu_items').where({ id }).del()
};

module.exports = MenuItem;