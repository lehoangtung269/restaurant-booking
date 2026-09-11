/** Bảng reservations + index cho query check trống và dashboard */
exports.up = async function (knex) {
    await knex.schema.createTable('reservations', (t) => {
        t.increments('id').primary();
        t.integer('user_id').notNullable();
        t.integer('table_id').notNullable();
        t.date('reservation_date').notNullable();
        t.time('start_time').notNullable();
        t.time('end_time').notNullable();
        t.integer('guest_count').notNullable();
        t.string('special_notes', 500).nullable();
        t.string('status', 20).notNullable().defaultTo('CONFIRMED');
        t.integer('cancelled_by').nullable();
        t.timestamp('cancelled_at', { useTz: true }).nullable();
        t.timestamp('created_date', { useTz: true }).defaultTo(knex.fn.now());
        t.timestamp('modified_date', { useTz: true }).defaultTo(knex.fn.now());
        t.index('user_id');
        t.index(['reservation_date', 'status']);
        t.index(['table_id', 'reservation_date', 'status']);
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('reservations');
};
