const { Queue } = require('bullmq');
const env = require('../config/env');

/**
 * BullMQ queue: bookingQueue
 *
 * Producers (reservation controller) add jobs here immediately after
 * a successful Redis Lua seat reservation.
 *
 * Consumers (booking.worker.js) pick jobs off this queue and write
 * the booking record to PostgreSQL.
 *
 * Using a dedicated connection object is recommended by BullMQ so that
 * the queue connection is independent from the shared ioredis client
 * used for inventory and idempotency.
 */
const bookingQueue = new Queue('bookingQueue', {
  connection: {
    host: env.redis.host,
    port: env.redis.port,
  },
  defaultJobOptions: {
    // Retain the last 100 completed jobs for inspection
    removeOnComplete: { count: 100 },
    // Retain the last 50 failed jobs for debugging
    removeOnFail: { count: 50 },
  },
});

module.exports = { bookingQueue };
