const knex = require('knex')({
    client: 'postgresql',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: true }
            : { rejectUnauthorized: false }
    },
    pool: { min: 2, max: 10 }
});

module.exports = knex;