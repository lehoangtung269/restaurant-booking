/** Bảng users + restaurant_tables */
exports.up = async function (knex) {
    await knex.schema.createTable('users', (t) => {
        t.increments('id').primary();
        t.string('full_name', 255).notNullable();
        t.string('email', 255).notNullable().unique();
        t.string('password_hash', 255).notNullable();
        t.string('phone', 20).nullable();
        t.string('role', 20).notNullable().defaultTo('CUSTOMER');
        t.boolean('is_active').notNullable().defaultTo(true);
        t.timestamp('created_date', { useTz: true }).defaultTo(knex.fn.now());
        t.timestamp('modified_date', { useTz: true }).defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('restaurant_tables', (t) => {
        t.increments('id').primary();
        t.string('table_number', 50).notNullable().unique();
        t.integer('capacity').notNullable();
        t.string('area', 20).notNullable().defaultTo('INDOOR');
        t.string('status', 20).notNullable().defaultTo('AVAILABLE');
        t.timestamp('created_date', { useTz: true }).defaultTo(knex.fn.now());
        t.timestamp('modified_date', { useTz: true }).defaultTo(knex.fn.now());
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('restaurant_tables');
    await knex.schema.dropTableIfExists('users');
};
