const fs = require('fs');
const path = require('path');
const { redis } = require('../config/redis');
const { buildInventoryKey } = require('./inventory.service');

// Load the Lua script once at module initialisation time.
// ioredis will register it with Redis via SCRIPT LOAD on first use (evalsha).
const luaScript = fs.readFileSync(
  path.join(__dirname, '../scripts/reserveSeat.lua'),
  'utf8'
);

/**
 * Atomically attempt to reserve one seat using a Lua script executed on Redis.
 *
 * The Lua script performs the check-and-decrement as a single indivisible
 * operation, preventing race conditions where two concurrent requests could
 * both read a non-zero count and both decrement, overselling the inventory.
 *
 * No PostgreSQL writes happen here. The reservation is purely in Redis;
 * persistence to the database is handled in a future block.
 *
 * @param {object} params
 * @param {number|string} params.trainId
 * @param {string}        params.journeyDate  — YYYY-MM-DD
 * @param {string}        params.travelClass  — e.g. 'AC3', 'Sleeper'
 *
 * @returns {Promise<
 *   { success: true,  remainingSeats: number } |
 *   { success: false, message: string }
 * >}
 */
const reserveSeat = async ({ trainId, journeyDate, travelClass }) => {
  const key = buildInventoryKey(trainId, journeyDate, travelClass);

  // eval(script, numkeys, key1, key2, ..., arg1, arg2, ...)
  // We pass 1 key and no extra ARGV args; all logic lives in the script.
  const result = await redis.eval(luaScript, 1, key);

  const statusCode = result[0];

  if (statusCode === 1) {
    // Script returned {1, remaining} — seat successfully reserved
    return { success: true, remainingSeats: result[1] };
  }

  if (statusCode === 0) {
    // Script returned {0} — counter was 0 or less
    return { success: false, message: 'Sold Out' };
  }

  // statusCode === -1: key does not exist — inventory was never loaded
  return {
    success: false,
    message: 'Inventory not found in Redis. Please load inventory first.',
  };
};

module.exports = { reserveSeat };
