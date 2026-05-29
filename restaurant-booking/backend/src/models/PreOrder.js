const db = require('../config/database');

const PreOrder = {
    findByReservation: (reservation_id) =>
        db('pre_orders').where({ reservation_id }).first(),

    findByIdWithItems: (id) =>
        db('pre_orders')
            .where('pre_orders.id', id)
            .first()
            .then(async (preOrder) => {
                if (!preOrder) return null;
                const items = await db('pre_order_items')
                    .join('menu_items', 'pre_order_items.menu_item_id', 'menu_items.id')
                    .where('pre_order_id', preOrder.id)
                    .select(
                        'pre_order_items.*',
                        'menu_items.name as item_name',
                        'menu_items.image_url'
                    );
                return { ...preOrder, items };
            }),

    create: (trx, data) =>
        trx('pre_orders').insert(data).returning('*'),

    createItems: (trx, items) =>
        trx('pre_order_items').insert(items).returning('*'),

    updateTotal: (trx, id, total_amount) =>
        trx('pre_orders').where({ id }).update({ total_amount }).returning('*'),

    deleteItems: (trx, pre_order_id) =>
        trx('pre_order_items').where({ pre_order_id }).del(),

    cancel: (trx, id) =>
        trx('pre_orders').where({ id }).update({ status: 'CANCELLED' }).returning('*')
};

module.exports = PreOrder;