const express = require('express');
const { reserve } = require('../controllers/reservation.controller');
const { authenticate } = require('../middleware/auth');
const { idempotency } = require('../middleware/idempotency');

const router = express.Router();

/**
 * POST /reservation/reserve
 *
 * Middleware chain (in order):
 *   1. authenticate  — verify JWT, attach req.user
 *   2. idempotency   — return cached response if Idempotency-Key was seen before
 *   3. reserve       — run Lua reservation + enqueue BullMQ job
 */
router.post('/reserve', authenticate, idempotency, reserve);

module.exports = router;
