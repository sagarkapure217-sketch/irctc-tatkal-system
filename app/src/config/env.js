require('dotenv').config();

const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // ── PostgreSQL ──────────────────────────────────────────────────────────────
  // Production (Neon / Render):  set DATABASE_URL and optionally DB_SSL=true
  // Local Docker:                set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
  db: {
    // Connection string — present on Neon / Render, absent in local Docker
    url:      process.env.DATABASE_URL || null,
    // Enable SSL for managed cloud databases (Neon requires it)
    ssl:      process.env.DB_SSL === 'true',
    // Individual params — used only when DATABASE_URL is not set
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 5432,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name:     process.env.DB_NAME,
  },

  // ── Redis ───────────────────────────────────────────────────────────────────
  // Production (Upstash / Render): set REDIS_URL (rediss:// or redis://)
  // Local Docker:                  set REDIS_HOST + REDIS_PORT
  redis: {
    url:  process.env.REDIS_URL  || null,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },

  // ── JWT ─────────────────────────────────────────────────────────────────────
  jwtSecret: process.env.JWT_SECRET,

  // ── Tatkal booking window ───────────────────────────────────────────────────
  // Format: HH:mm (24-hour). Defaults to 10:00 if not set.
  tatkalOpenTime: process.env.TATKAL_OPEN_TIME || '10:00',

  // ── Payment hold TTL ────────────────────────────────────────────────────────
  // Defaults to 60 seconds if not set.
  paymentHoldTtl: parseInt(process.env.PAYMENT_HOLD_TTL_SECONDS, 10) || 60,
};

// ── Startup validation ──────────────────────────────────────────────────────
// JWT_SECRET is always required.
// DB credentials are only required when DATABASE_URL is absent (local Docker).
const required = ['JWT_SECRET'];

if (!process.env.DATABASE_URL) {
  // Local mode: individual connection params must be present.
  required.push('DB_USER', 'DB_PASSWORD', 'DB_NAME');
}

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`[ENV] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = env;
