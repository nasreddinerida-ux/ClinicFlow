const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres', // <-- Change 'localhost' to 'postgres' here
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_NAME || 'clinicflow',
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database successfully.');
});

module.exports = pool;