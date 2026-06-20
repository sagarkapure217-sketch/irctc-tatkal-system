const express = require('express');
const { paymentSuccess } = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /payments/success
// Simulate payment success and confirm the booking
router.post('/success', authenticate, paymentSuccess);

module.exports = router;
