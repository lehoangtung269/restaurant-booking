/** Bảng reviews (1 đơn 1 review) + notifications */
exports.up = async function (knex) {
    await knex.schema.createTable('reviews', (t) => {
        t.increments('id').primary();
        t.integer('reservation_id').notNullable().unique();
        t.integer('user_id').notNullable();
        t.smallint('rating').notNullable();
        t.string('comment', 1000).nullable();
        t.text('manager_reply').nullable();
        t.timestamp('created_date', { useTz: true }).defaultTo(knex.fn.now());
        t.index('user_id');
    });

    await knex.schema.createTable('notifications', (t) => {
        t.increments('id').primary();
        t.integer('user_id').notNullable();
        t.string('type', 50).notNullable();
        t.string('title', 255).notNullable();
        t.text('message').notNullable();
        t.boolean('is_read').notNullable().defaultTo(false);
        t.timestamp('created_date', { useTz: true }).defaultTo(knex.fn.now());
        t.index(['user_id', 'is_read']);
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('notifications');
    await knex.schema.dropTableIfExists('reviews');
};
