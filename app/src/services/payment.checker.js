const { query } = require('../config/db');
const { redis } = require('../config/redis');
const { buildInventoryKey } = require('./inventory.service');
const { emitSeatUpdate } = require('../config/socket');
const env = require('../config/env');

/**
 * Expiry checker for payment holds.
 *
 * Runs a simple polling loop every 5 seconds.
 * 1. Finds all bookings stuck in 'PENDING_PAYMENT'.
 * 2. Checks if the corresponding Redis TTL key (seat_hold:{bookingId}) still exists.
 * 3. If the hold key is gone (TTL expired), the seat is returned to inventory (INCR)
 *    and the booking status changes to 'PAYMENT_EXPIRED'.
 *
 * Why polling?
 * Redis Keyspace Notifications could trigger an event exactly when a key expires,
 * but polling is significantly simpler, requires no Pub/Sub architecture, and naturally
 * guarantees that missed expirations (if the server was down) are caught upon restart.
 */
const startPaymentChecker = () => {
  console.log('[PaymentChecker] Started polling for expired payment holds every 5s.');

  setInterval(async () => {
    try {
      // 1. Fetch all bookings waiting for payment
      const result = await query(
        `SELECT id, train_id, journey_date, travel_class 
         FROM bookings 
         WHERE status = 'PENDING_PAYMENT'`
      );

      for (const row of result.rows) {
        const holdKey = `seat_hold:${row.id}`;
        
        // 2. Check if hold still exists
        // redis.exists returns 1 if key exists, 0 if not.
        const exists = await redis.exists(holdKey);

        if (exists === 0) {
          console.log(`[PaymentChecker] Booking ${row.id} payment hold expired. Restoring seat.`);

          // 3. Hold expired -> Restore inventory and fail the booking
          const journeyDateStr = row.journey_date.toISOString().slice(0, 10);
          const inventoryKey = buildInventoryKey(
            row.train_id,
            journeyDateStr,
            row.travel_class
          );

          // 1. Increment inventory (existing logic)
          const incrementedCount = await redis.incr(inventoryKey);
          emitSeatUpdate(row.train_id, journeyDateStr, row.travel_class, incrementedCount);

          // Fail the original booking
          await query(
            `UPDATE bookings SET status = 'PAYMENT_EXPIRED' WHERE id = $1`,
            [row.id]
          );

          // 2. Immediately check waitlist
          const waitlistKey = `waitlist:${row.train_id}:${journeyDateStr}:${row.travel_class}`;

          // 3. Use ZPOPMIN to get oldest booking (FIFO)
          // Returns array: ['bookingId', 'score'] or empty []
          const popped = await redis.zpopmin(waitlistKey);

          // 4. If a booking exists, promote it
          if (popped && popped.length > 0) {
            const promotedBookingId = popped[0];
            console.log(`[PaymentChecker] Auto-promoting booking ${promotedBookingId} from waitlist.`);

            // reserve released seat
            const decrementedCount = await redis.decr(inventoryKey);
            emitSeatUpdate(row.train_id, journeyDateStr, row.travel_class, decrementedCount);

            // create/update booking (set booking status = PENDING_PAYMENT)
            const promotedResult = await query(
              `UPDATE bookings 
               SET status = 'PENDING_PAYMENT' 
               WHERE id = $1 AND status = 'WAITLISTED'
               RETURNING id`,
              [promotedBookingId]
            );

            if (promotedResult.rows.length > 0) {
              const newBookingId = promotedResult.rows[0].id;
              
              // create Redis seat_hold key
              const newHoldKey = `seat_hold:${newBookingId}`;
              await redis.set(newHoldKey, 'held', 'EX', env.paymentHoldTtl);
              console.log(`[PaymentChecker] Auto-promoted booking ${newBookingId}. Hold key: ${newHoldKey} (${env.paymentHoldTtl}s)`);
            } else {
              // Safety fallback: if waitlist DB row was missing, restore seat
              const restoredCount = await redis.incr(inventoryKey);
              emitSeatUpdate(row.train_id, journeyDateStr, row.travel_class, restoredCount);
            }
          }
        }
      }
    } catch (err) {
      console.error('[PaymentChecker] Error during polling cycle:', err.message);
    }
  }, 5000); // Poll every 5 seconds
};

module.exports = { startPaymentChecker };
