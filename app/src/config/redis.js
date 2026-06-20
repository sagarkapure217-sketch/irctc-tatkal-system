const Redis = require('ioredis');
const env = require('./env');

// ── Connection configuration ────────────────────────────────────────────────
// Production (Upstash / Render): REDIS_URL is set (rediss:// for TLS).
// Local Docker:                  REDIS_HOST + REDIS_PORT used.
const redisConfig = env.redis.url
  ? {
      // Cloud path — Upstash uses rediss:// (TLS); ioredis handles it natively
      // when a URL string is passed to the constructor directly.
      // We still layer on the retry strategy by passing the URL as a string
      // alongside options via the second argument form.
    }
  : {
      // Local Docker path
      host: env.redis.host,
      port: env.redis.port,
    };

const commonOptions = {
  lazyConnect: true,         // connect explicitly so we can handle errors cleanly
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    console.warn(`[Redis] Retrying connection (attempt ${times})...`);
    return delay;
  },
};

// When REDIS_URL is present, pass it as the first argument (string URL).
// ioredis automatically handles rediss:// TLS URLs.
// When absent, pass the host/port options object.
const redis = env.redis.url
  ? new Redis(env.redis.url, commonOptions)
  : new Redis({ ...redisConfig, ...commonOptions });

redis.on('connect', () => {
  console.log('[Redis] Connection established.');
});

redis.on('ready', () => {
  console.log('[Redis] Client is ready to use.');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('close', () => {
  console.warn('[Redis] Connection closed.');
});

redis.on('reconnecting', () => {
  console.warn('[Redis] Reconnecting...');
});

/**
 * Test Redis connectivity by sending a PING command.
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  const result = await redis.ping();
  return result === 'PONG';
};

module.exports = { redis, testConnection };
