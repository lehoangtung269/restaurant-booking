/** Bảng categories + menu_items */
exports.up = async function (knex) {
    await knex.schema.createTable('categories', (t) => {
        t.increments('id').primary();
        t.string('code', 50).notNullable().unique();
        t.string('name', 255).notNullable();
        t.text('description').nullable();
        t.text('image_url').nullable();
        t.timestamp('created_date', { useTz: true }).defaultTo(knex.fn.now());
        t.timestamp('modified_date', { useTz: true }).defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('menu_items', (t) => {
        t.increments('id').primary();
        t.integer('category_id').notNullable();
        t.string('name', 255).notNullable();
        t.text('description').nullable();
        t.decimal('price', 12, 2).notNullable();
        t.text('image_url').nullable();
        t.boolean('is_available').notNullable().defaultTo(true);
        t.timestamp('created_date', { useTz: true }).defaultTo(knex.fn.now());
        t.timestamp('modified_date', { useTz: true }).defaultTo(knex.fn.now());
        t.index('category_id');
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('menu_items');
    await knex.schema.dropTableIfExists('categories');
};
