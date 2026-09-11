/** Bảng pre_orders (1 đơn 1 pre-order) + pre_order_items */
exports.up = async function (knex) {
    await knex.schema.createTable('pre_orders', (t) => {
        t.increments('id').primary();
        t.integer('reservation_id').notNullable().unique();
        t.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
        t.string('status', 20).notNullable().defaultTo('ACTIVE');
        t.timestamp('created_date', { useTz: true }).defaultTo(knex.fn.now());
        t.timestamp('modified_date', { useTz: true }).defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('pre_order_items', (t) => {
        t.increments('id').primary();
        t.integer('pre_order_id').notNullable();
        t.integer('menu_item_id').notNullable();
        t.integer('quantity').notNullable();
        t.decimal('unit_price', 12, 2).notNullable();
        t.string('notes', 255).nullable();
        t.index('pre_order_id');
        t.index('menu_item_id');
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('pre_order_items');
    await knex.schema.dropTableIfExists('pre_orders');
};
