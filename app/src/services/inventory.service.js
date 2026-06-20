const { query } = require('../config/db');
const { redis } = require('../config/redis');

/**
 * Build the Redis key for a specific seat inventory slot.
 *
 * Format: seat_inventory:{trainId}:{journeyDate}:{travelClass}
 * Example: seat_inventory:5:2025-08-01:AC3
 *
 * @param {number|string} trainId
 * @param {string} journeyDate  — YYYY-MM-DD
 * @param {string} travelClass  — e.g. 'AC3', 'Sleeper'
 * @returns {string}
 */
const buildInventoryKey = (trainId, journeyDate, travelClass) =>
  `seat_inventory:${trainId}:${journeyDate}:${travelClass}`;

/**
 * Load ALL rows from the train_inventory table into Redis.
 *
 * Each row becomes a simple Redis string counter keyed by:
 *   seat_inventory:{train_id}:{journey_date}:{travel_class}
 *
 * This function is safe to call multiple times — it overwrites
 * existing keys with the current PostgreSQL values.
 *
 * Call this once during startup, or manually via the admin endpoint
 * to resync Redis with the database.
 *
 * @returns {Promise<{ loaded: number }>}
 */
const loadInventoryIntoRedis = async () => {
  const result = await query(
    `SELECT train_id, journey_date, travel_class, available_seats
     FROM train_inventory`
  );

  if (result.rows.length === 0) {
    console.warn('[InventoryLoader] No inventory rows found in PostgreSQL. Redis not populated.');
    return { loaded: 0 };
  }

  // Use a Redis pipeline for efficiency — sends all SET commands in one round-trip
  const pipeline = redis.pipeline();

  for (const row of result.rows) {
    const key = buildInventoryKey(
      row.train_id,
      // journey_date comes back as a JS Date from pg; format it as YYYY-MM-DD
      row.journey_date.toISOString().slice(0, 10),
      row.travel_class
    );
    pipeline.set(key, row.available_seats);
  }

  await pipeline.exec();

  console.log(`[InventoryLoader] Loaded ${result.rows.length} inventory rows into Redis.`);
  return { loaded: result.rows.length };
};

module.exports = { buildInventoryKey, loadInventoryIntoRedis };
