const tatkalService = require('../services/tatkal.service');

/**
 * POST /admin/tatkal/open
 * Forces the Tatkal window to OPEN regardless of the current server time.
 * For local demo and testing only.
 */
const forceOpen = (req, res) => {
  tatkalService.setOverride(true);

  return res.status(200).json({
    success: true,
    message: 'Tatkal window has been forced OPEN (admin override).',
    overrideActive: true,
    isOpen: true,
  });
};

/**
 * POST /admin/tatkal/close
 * Forces the Tatkal window to CLOSED regardless of the current server time.
 * For local demo and testing only.
 */
const forceClose = (req, res) => {
  tatkalService.setOverride(false);

  return res.status(200).json({
    success: true,
    message: 'Tatkal window has been forced CLOSED (admin override).',
    overrideActive: true,
    isOpen: false,
  });
};

/**
 * POST /admin/tatkal/reset
 * Clears any active admin override and restores time-based logic.
 */
const resetOverride = (req, res) => {
  tatkalService.setOverride(null);

  const { isOpen, currentTime, openTime } = tatkalService.getStatus();

  return res.status(200).json({
    success: true,
    message: 'Admin override cleared. Tatkal window is now controlled by server time.',
    overrideActive: false,
    isOpen,
    currentTime,
    openTime,
  });
};

module.exports = { forceOpen, forceClose, resetOverride };
