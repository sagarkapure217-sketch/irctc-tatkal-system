const express = require('express');
const { getMyBookings } = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /bookings/my
 * 
 * Middleware chain:
 *   1. authenticate - verify JWT and attach req.user
 *   2. getMyBookings - return all bookings for this user
 */
router.get('/my', authenticate, getMyBookings);

module.exports = router;
