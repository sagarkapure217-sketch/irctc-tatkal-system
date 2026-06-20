const { reserveSeat } = require('../services/reservation.service');
const { bookingQueue } = require('../queue/booking.queue');
const { redis } = require('../config/redis');
const { emitSeatUpdate } = require('../config/socket');

/**
 * POST /reservation/reserve
 *
 * Full flow (middleware applied in reservation.routes.js):
 *   1. JWT authentication     — req.user.id is available here
 *   2. Idempotency check      — duplicate requests return cached response
 *   3. Input validation       — body fields checked below
 *   4. Redis Lua reservation  — atomic seat decrement
 *   5. BullMQ enqueue         — booking job added for background processing
 *   6. HTTP 202 response      — returns immediately; worker handles DB write
 *
 * Does NOT create a booking record directly.
 * Does NOT update PostgreSQL here.
 * Does NOT initiate payment.
 */
const reserve = async (req, res) => {
  const { trainId, journeyDate, travelClass } = req.body;

  // req.user is set by the authenticate middleware (JWT payload)
  const userId = req.user.id;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!trainId || !journeyDate || !travelClass) {
    return res.status(400).json({
      success: false,
      message: 'trainId, journeyDate, and travelClass are required.',
    });
  }

  const parsedTrainId = parseInt(trainId, 10);
  if (isNaN(parsedTrainId) || parsedTrainId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'trainId must be a positive integer.',
    });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(journeyDate) || isNaN(Date.parse(journeyDate))) {
    return res.status(400).json({
      success: false,
      message: 'journeyDate must be a valid date in YYYY-MM-DD format.',
    });
  }

  if (typeof travelClass !== 'string' || travelClass.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'travelClass must be a non-empty string.',
    });
  }

  // ── Atomic Redis seat reservation (Lua script) ────────────────────────────
  const result = await reserveSeat({
    trainId: parsedTrainId,
    journeyDate,
    travelClass: travelClass.trim(),
  });

  if (!result.success) {
    if (result.message === 'Sold Out') {
      const waitlistKey = `waitlist:${parsedTrainId}:${journeyDate}:${travelClass.trim()}`;
      
      // Create a WAITLISTED booking record directly
      const { query } = require('../config/db');
      const waitlistInsert = await query(
        `INSERT INTO bookings (user_id, train_id, journey_date, travel_class, status)
         VALUES ($1, $2, $3, $4, 'WAITLISTED')
         RETURNING id`,
        [userId, parsedTrainId, journeyDate, travelClass.trim()]
      );

      const bookingId = waitlistInsert.rows[0].id;

      // Add bookingId to Redis waitlist (Sorted Set) scored by timestamp for FIFO ordering
      await redis.zadd(waitlistKey, Date.now(), bookingId);

      return res.status(202).json({
        success: true,
        message: 'Added to waitlist.',
      });
    }

    return res.status(503).json({
      success: false,
      message: result.message,
    });
  }

  // ── Enqueue booking job ───────────────────────────────────────────────────
  // The worker will write the PENDING booking record to PostgreSQL.
  // We do not wait for the worker to finish — the API responds immediately.
  await bookingQueue.add('createBooking', {
    userId,
    trainId:     parsedTrainId,
    journeyDate,
    travelClass: travelClass.trim(),
  });

  // Emit real-time update to Socket.io clients
  emitSeatUpdate(parsedTrainId, journeyDate, travelClass.trim(), result.remainingSeats);

  // HTTP 202 Accepted: request received and queued, not yet processed
  return res.status(202).json({
    success: true,
    message: 'Reservation accepted and queued.',
  });
};

module.exports = { reserve };
