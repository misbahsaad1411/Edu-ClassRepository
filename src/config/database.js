
const { Pool } = require('pg');

const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
    : new Pool({
            host: '127.0.0.1',
            port: 5432,
            database: 'edu_classrepo',
            user: 'postgres',
            password: 'server123'
        });

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL');
});

module.exports = pool;
