require('dotenv').config();

const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // PostgreSQL
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET,

  // Tatkal booking window
  // Format: HH:mm (24-hour). Defaults to 10:00 if not set.
  tatkalOpenTime: process.env.TATKAL_OPEN_TIME || '10:00',

  // Payment hold TTL
  // Defaults to 60 seconds if not set.
  paymentHoldTtl: parseInt(process.env.PAYMENT_HOLD_TTL_SECONDS, 10) || 60,
};

// Validate required environment variables at startup
const required = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`[ENV] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = env;
