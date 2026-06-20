const bookingService = require('../services/booking.service');

/**
 * GET /bookings/my
 * Returns all bookings for the authenticated user.
 */
const getMyBookings = async (req, res) => {
  // Extract user ID from the verified JWT (populated by auth middleware)
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: User identity could not be verified.',
    });
  }

  const result = await bookingService.getMyBookings(userId);

  if (!result.success) {
    return res.status(result.statusCode || 500).json({
      success: false,
      message: result.message,
    });
  }

  // Returns 200 OK even if the data array is empty, per requirements.
  return res.status(200).json({
    success: true,
    data: result.data,
  });
};

module.exports = { getMyBookings };
