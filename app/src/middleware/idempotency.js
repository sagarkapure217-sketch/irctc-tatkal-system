const { redis } = require('../config/redis');

const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours

/**
 * Build the Redis key used to store an idempotency record.
 *
 * Format: idempotency:{clientKey}
 * Example: idempotency:550e8400-e29b-41d4-a716-446655440000
 *
 * @param {string} clientKey — raw value of the Idempotency-Key header
 * @returns {string}
 */
const buildIdempotencyKey = (clientKey) => `idempotency:${clientKey}`;

/**
 * Idempotency middleware for POST /reservation/reserve.
 *
 * Flow:
 *  1. Require the Idempotency-Key header (400 if missing).
 *  2. Look up the key in Redis.
 *     a. HIT  → deserialise the cached response and return it immediately.
 *              The Lua script is NOT executed again.
 *     b. MISS → intercept res.json() so we can capture the response body
 *              and status code, store them in Redis with a 24-hour TTL,
 *              then send the response normally.
 *
 * The interception approach (monkey-patching res.json) is intentional:
 * it avoids any coupling between this middleware and the controller/service
 * layers, so those files remain unchanged.
 */
const idempotency = async (req, res, next) => {
  const clientKey = req.headers['idempotency-key'];

  // ── 1. Header is required ─────────────────────────────────────────────────
  if (!clientKey || clientKey.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key header is required.',
    });
  }

  const redisKey = buildIdempotencyKey(clientKey.trim());

  // ── 2. Cache lookup ───────────────────────────────────────────────────────
  const cached = await redis.get(redisKey);

  if (cached !== null) {
    // HIT: return the stored response without touching the Lua script
    const { statusCode, body } = JSON.parse(cached);

    // Signal to the caller that this is a replayed response
    res.setHeader('X-Idempotency-Replayed', 'true');
    return res.status(statusCode).json(body);
  }

  // ── 3. Cache miss: intercept the outgoing response ────────────────────────
  // We wrap res.json so that after the controller writes its response,
  // we store {statusCode, body} in Redis before the bytes leave the socket.
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    try {
      const record = JSON.stringify({ statusCode: res.statusCode, body });
      // Store with 24-hour TTL — EX sets TTL in seconds
      await redis.set(redisKey, record, 'EX', IDEMPOTENCY_TTL_SECONDS);
    } catch (err) {
      // Non-fatal: log and continue. The response is still sent correctly.
      console.error('[Idempotency] Failed to cache response:', err.message);
    }

    // Restore and call the real res.json
    res.json = originalJson;
    return originalJson(body);
  };

  next();
};

module.exports = { idempotency };
