const { query } = require('../config/db');

/**
 * Fetch all bookings for a given user.
 * 
 * @param {number} userId 
 */
const getMyBookings = async (userId) => {
  try {
    const result = await query(
      `SELECT
          b.id AS "bookingId",
          t.id AS "trainId",
          t.train_number AS "trainNumber",
          t.train_name AS "trainName",
          s_src.station_name AS "sourceStation",
          s_dst.station_name AS "destinationStation",
          b.journey_date AS "journeyDate",
          b.travel_class AS "travelClass",
          b.status AS "status",
          b.created_at AS "createdAt"
       FROM bookings b
       JOIN trains t ON t.id = b.train_id
       JOIN stations s_src ON s_src.id = t.source_station_id
       JOIN stations s_dst ON s_dst.id = t.destination_station_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    // Format dates correctly if necessary, but pg driver returns them as Date objects
    // which serialize nicely to JSON.

    return {
      success: true,
      data: result.rows,
    };
  } catch (err) {
    console.error('[BookingService] getMyBookings error:', err.message);
    return {
      success: false,
      statusCode: 500,
      message: 'An unexpected error occurred while fetching bookings. Please try again.',
    };
  }
};

module.exports = { getMyBookings };
