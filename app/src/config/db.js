const { Pool } = require('pg');
const env = require('./env');

// Create a connection pool for better performance under load
const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  max: 10,              // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool-level errors (e.g., idle client errors)
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

/**
 * Execute a SQL query using a pool client.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Test the database connection.
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, testConnection };
