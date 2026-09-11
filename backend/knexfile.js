// Cấu hình knex cho 3 môi trường. Tất cả đọc DATABASE_URL.
// Ví dụ local: postgres://app:app123@localhost:5432/restaurant_booking
// Ví dụ cloud: postgres://user:pass@host:5432/db?sslmode=require
const { getSslConfig } = require('./src/config/dbSsl');

const base = {
    client: 'postgresql',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: getSslConfig(),
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' },
};

module.exports = {
    development: { ...base },
    test: { ...base },
    production: { ...base },
};
