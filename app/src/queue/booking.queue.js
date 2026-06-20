const { Queue } = require('bullmq');
const env = require('../config/env');

/**
 * BullMQ requires its own dedicated Redis connection — separate from the
 * shared ioredis client used for inventory and idempotency.
 *
 * Connection strategy:
 *   Production (Upstash / Render): REDIS_URL is set → pass { url } to BullMQ.
 *   Local Docker:                  REDIS_URL absent  → use host + port.
 *
 * BullMQ accepts { url } as a valid IORedis connection option when the
 * value is a full redis:// or rediss:// URL string.
 */
const bullmqConnection = env.redis.url
  ? { url: env.redis.url }
  : { host: env.redis.host, port: env.redis.port };

const bookingQueue = new Queue('bookingQueue', {
  connection: bullmqConnection,
  defaultJobOptions: {
    // Retain the last 100 completed jobs for inspection
    removeOnComplete: { count: 100 },
    // Retain the last 50 failed jobs for debugging
    removeOnFail: { count: 50 },
  },
});

module.exports = { bookingQueue };
