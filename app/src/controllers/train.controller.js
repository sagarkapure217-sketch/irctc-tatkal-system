const trainService = require('../services/train.service');

/**
 * GET /trains/search
 * Search for trains by source station code, destination station code, and date.
 *
 * Query params:
 *   - source       (required) — station_code, e.g. 'NDLS'
 *   - destination  (required) — station_code, e.g. 'HWH'
 *   - date         (required) — journey date in YYYY-MM-DD format
 */
const searchTrains = async (req, res) => {
  const { source, destination, date } = req.query;

  // Validate required query params
  if (!source || !destination || !date) {
    return res.status(400).json({
      success: false,
      message: 'source, destination, and date query parameters are required.',
    });
  }

  // Station codes/names must not be identical
  if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
    return res.status(400).json({
      success: false,
      message: 'source and destination stations must be different.',
    });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date) || isNaN(Date.parse(date))) {
    return res.status(400).json({
      success: false,
      message: 'date must be a valid date in YYYY-MM-DD format.',
    });
  }

  const result = await trainService.searchTrains({ source, destination, date });

  if (!result.success) {
    return res.status(result.statusCode || 500).json({
      success: false,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data,
  });
};

/**
 * GET /trains/:trainId/availability
 * Get seat availability for a specific train, date, and class.
 *
 * Path param:
 *   - trainId  (required, integer)
 *
 * Query params:
 *   - date   (required, YYYY-MM-DD)
 *   - class  (required)
 */
const getAvailability = async (req, res) => {
  const { trainId } = req.params;
  const { date, class: travelClass } = req.query;

  // Validate trainId is a positive integer
  const parsedTrainId = parseInt(trainId, 10);
  if (isNaN(parsedTrainId) || parsedTrainId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'trainId must be a positive integer.',
    });
  }

  if (!date || !travelClass) {
    return res.status(400).json({
      success: false,
      message: 'date and class query parameters are required.',
    });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date) || isNaN(Date.parse(date))) {
    return res.status(400).json({
      success: false,
      message: 'date must be a valid date in YYYY-MM-DD format.',
    });
  }

  const result = await trainService.getAvailability({
    trainId: parsedTrainId,
    date,
    travelClass,
  });

  if (!result.success) {
    return res.status(result.statusCode || 500).json({
      success: false,
      message: result.message,
    });
  }

  return res.status(200).json({
    success: true,
    data: result.data,
  });
};

module.exports = { searchTrains, getAvailability };
