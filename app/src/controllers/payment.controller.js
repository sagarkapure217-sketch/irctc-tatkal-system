const { query } = require('../config/db');
const { redis } = require('../config/redis');
const { buildInventoryKey } = require('../services/inventory.service');
const { emitSeatUpdate } = require('../config/socket');

/**
 * POST /payments/success
 *
 * Mock endpoint to simulate a successful payment.
 *
 * Flow:
 *  1. Verify the booking exists and is in 'PENDING_PAYMENT' status.
 *  2. Delete the Redis hold key (seat_hold:{bookingId}) so the expiry checker ignores it.
 *  3. Update the booking status to 'CONFIRMED'.
 */
const paymentSuccess = async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: 'bookingId is required.',
    });
  }

  try {
    // 1. Verify booking
    const result = await query(
      `SELECT id, status, train_id, journey_date, travel_class FROM bookings WHERE id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    const booking = result.rows[0];

    if (booking.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be confirmed. Current status: ${booking.status}`,
      });
    }

    // 2. Delete Redis hold key
    const holdKey = `seat_hold:${bookingId}`;
    await redis.del(holdKey);

    // 3. Update status to CONFIRMED
    await query(
      `UPDATE bookings SET status = 'CONFIRMED' WHERE id = $1`,
      [bookingId]
    );

    // 4. Emit seat update
    const journeyDateStr = booking.journey_date.toISOString().slice(0, 10);
    const inventoryKey = buildInventoryKey(
      booking.train_id,
      journeyDateStr,
      booking.travel_class
    );
    const availableSeats = await redis.get(inventoryKey);
    emitSeatUpdate(booking.train_id, journeyDateStr, booking.travel_class, availableSeats);

    return res.status(200).json({
      success: true,
      message: 'Payment successful. Booking is now CONFIRMED.',
    });
  } catch (err) {
    console.error('[PaymentController] Error processing payment success:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing payment.',
    });
  }
};

module.exports = { paymentSuccess };
