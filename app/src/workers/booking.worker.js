const { Worker } = require('bullmq');
const { query } = require('../config/db');
const { buildInventoryKey } = require('../services/inventory.service');
const { redis } = require('../config/redis');
const env = require('../config/env');

/**
 * BullMQ booking worker.
 *
 * Consumes jobs from the 'bookingQueue' and writes a PENDING_PAYMENT booking
 * record to PostgreSQL for each successfully reserved seat, then places a
 * temporary hold on the seat in Redis (configurable TTL, defaults to 60s).
 *
 * If the PostgreSQL insert fails, the worker compensates by incrementing
 * the Redis seat counter (INCR), restoring the seat that was decremented
 * by the Lua reservation script.
 *
 * No payment, waitlist, notification, or TTL logic is handled here.
 */
/**
 * Connection strategy (mirrors booking.queue.js):
 *   Production (Upstash / Render): REDIS_URL is set → pass { url } to BullMQ.
 *   Local Docker:                  REDIS_URL absent  → use host + port.
 */
const bullmqConnection = env.redis.url
  ? { url: env.redis.url }
  : { host: env.redis.host, port: env.redis.port };

const bookingWorker = new Worker(
  'bookingQueue',
  async (job) => {
    const { userId, trainId, journeyDate, travelClass } = job.data;

    console.log(
      `[BookingWorker] Processing job ${job.id}: ` +
      `user=${userId} train=${trainId} date=${journeyDate} class=${travelClass}`
    );

    try {
      // Insert the booking record with status PENDING_PAYMENT
      // RETURNING id allows us to create the hold key immediately
      const result = await query(
        `INSERT INTO bookings (user_id, train_id, journey_date, travel_class, status)
         VALUES ($1, $2, $3, $4, 'PENDING_PAYMENT')
         RETURNING id`,
        [userId, trainId, journeyDate, travelClass]
      );

      const bookingId = result.rows[0].id;

      // Place a mock payment hold in Redis
      const holdKey = `seat_hold:${bookingId}`;
      await redis.set(holdKey, 'held', 'EX', env.paymentHoldTtl);

      console.log(`[BookingWorker] Job ${job.id} completed — booking ${bookingId} created. Hold key: ${holdKey} (${env.paymentHoldTtl}s)`);
    } catch (err) {
      console.error(
        `[BookingWorker] Job ${job.id} failed — PostgreSQL insert error: ${err.message}`
      );

      // Compensate: restore the Redis seat counter that the Lua script decremented.
      // This prevents the seat from being permanently lost if the DB write fails.
      const inventoryKey = buildInventoryKey(trainId, journeyDate, travelClass);
      try {
        await redis.incr(inventoryKey);
        console.log(`[BookingWorker] Compensated Redis inventory for key: ${inventoryKey}`);
      } catch (redisErr) {
        // Log but don't swallow — BullMQ will see the thrown error and handle retry/failure
        console.error(
          `[BookingWorker] CRITICAL — Failed to restore Redis inventory: ${redisErr.message}`
        );
      }

      // Re-throw so BullMQ marks the job as failed (visible in the failed job list)
      throw err;
    }
  },
  {
    connection: bullmqConnection,
    // Process one job at a time to keep DB load predictable
    concurrency: 1,
  }
);

// ─── Worker lifecycle events ──────────────────────────────────────────────────

bookingWorker.on('completed', (job) => {
  console.log(`[BookingWorker] Job ${job.id} marked completed.`);
});

bookingWorker.on('failed', (job, err) => {
  console.error(`[BookingWorker] Job ${job?.id} marked failed: ${err.message}`);
});

bookingWorker.on('error', (err) => {
  console.error(`[BookingWorker] Worker-level error: ${err.message}`);
});

module.exports = { bookingWorker };
