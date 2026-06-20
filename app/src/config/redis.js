const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  lazyConnect: true,          // connect explicitly so we can handle errors cleanly
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    // Retry with exponential backoff, max 3 seconds
    const delay = Math.min(times * 100, 3000);
    console.warn(`[Redis] Retrying connection (attempt ${times})...`);
    return delay;
  },
});

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
