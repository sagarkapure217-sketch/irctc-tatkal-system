const tatkalService = require('../services/tatkal.service');

/**
 * GET /tatkal/status
 * Returns whether the Tatkal booking window is currently open,
 * the current server time, and the configured opening time.
 */
const getStatus = (req, res) => {
  const { isOpen, currentTime, openTime, overrideActive } = tatkalService.getStatus();

  return res.status(200).json({
    isOpen,
    currentTime,
    openTime,
    // Expose override flag so callers know the state is forced (useful for debugging)
    overrideActive,
  });
};

/**
 * POST /tatkal/check
 * Simulates a Tatkal booking attempt gate check.
 *
 * Returns 403 if the booking window has not opened yet.
 * Returns 200 if the window is open.
 *
 * Does NOT perform any booking or seat reservation.
 */
const checkWindow = (req, res) => {
  const { isOpen } = tatkalService.getStatus();

  if (!isOpen) {
    return res.status(403).json({
      success: false,
      message: 'Tatkal booking has not opened yet.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Tatkal booking window is open.',
  });
};

module.exports = { getStatus, checkWindow };
