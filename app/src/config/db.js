const { Pool } = require('pg');
const env = require('./env');

// ── Connection configuration ────────────────────────────────────────────────
// Production (Neon / Render): DATABASE_URL is set; DB_SSL=true enables TLS.
// Local Docker:               Individual host/port/user/password/database used.
const poolConfig = env.db.url
  ? {
      // Cloud path — Neon, Render Postgres, Supabase, etc.
      connectionString: env.db.url,
      ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      // Local Docker path — individual params from .env
      host:     env.db.host,
      port:     env.db.port,
      user:     env.db.user,
      password: env.db.password,
      database: env.db.name,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

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
