const env = require('../config/env');

/**
 * In-memory admin override for the Tatkal window.
 *
 * null  → use time-based logic (normal operation)
 * true  → force open  (admin override)
 * false → force closed (admin override)
 *
 * Resets to null on server restart (intentional — this is demo-only).
 */
let _override = null;

/**
 * Parse the TATKAL_OPEN_TIME env var into hours and minutes.
 * Returns { hours: number, minutes: number }.
 * Defaults to 10:00 if the env var is missing or malformed.
 */
const parseOpenTime = () => {
  const raw = env.tatkalOpenTime || '10:00';
  const parts = raw.split(':');
  const hours   = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  // Fall back to 10:00 if the value is not a valid time
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.warn(`[TatkalService] Invalid TATKAL_OPEN_TIME "${raw}", falling back to 10:00`);
    return { hours: 10, minutes: 0, formatted: '10:00' };
  }

  return {
    hours,
    minutes,
    formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
  };
};

/**
 * Determine whether the Tatkal booking window is currently open.
 *
 * Decision priority:
 *   1. Admin override (if set)
 *   2. Time-based comparison using TATKAL_OPEN_TIME
 *
 * @returns {boolean}
 */
const isTatkalOpen = () => {
  // Admin override takes priority over clock
  if (_override !== null) {
    return _override;
  }

  const { hours: openHours, minutes: openMinutes } = parseOpenTime();

  const now = new Date();
  const currentMinutesOfDay = now.getHours() * 60 + now.getMinutes();
  const openMinutesOfDay    = openHours * 60 + openMinutes;

  return currentMinutesOfDay >= openMinutesOfDay;
};

/**
 * Returns a full status snapshot useful for the /tatkal/status endpoint.
 *
 * @returns {{
 *   isOpen: boolean,
 *   currentTime: string,
 *   openTime: string,
 *   overrideActive: boolean
 * }}
 */
const getStatus = () => {
  const { formatted: openTime } = parseOpenTime();

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    isOpen:         isTatkalOpen(),
    currentTime,
    openTime,
    overrideActive: _override !== null,
  };
};

/**
 * Set the admin override.
 *
 * @param {true | false | null} value
 *   true  → force open
 *   false → force closed
 *   null  → clear override, revert to time-based logic
 */
const setOverride = (value) => {
  if (value !== true && value !== false && value !== null) {
    throw new Error('[TatkalService] setOverride accepts only true, false, or null.');
  }
  _override = value;
  console.log(`[TatkalService] Override set to: ${value === null ? 'CLEARED (time-based)' : value ? 'OPEN' : 'CLOSED'}`);
};

module.exports = { isTatkalOpen, getStatus, setOverride };
