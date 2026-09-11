const { getSslConfig } = require('./dbSsl');

const knex = require('knex')({
    client: 'postgresql',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: getSslConfig()
    },
    pool: { min: 2, max: 10 }
});

module.exports = knex;