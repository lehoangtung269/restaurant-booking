const knex = require('knex')({
    client: 'postgresql',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false, requestCert: false }
    },
    pool: { min: 2, max: 10 }
});

module.exports = knex;