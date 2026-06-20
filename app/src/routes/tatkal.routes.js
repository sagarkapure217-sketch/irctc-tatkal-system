const express = require('express');
const { getStatus, checkWindow } = require('../controllers/tatkal.controller');

const router = express.Router();

// GET /tatkal/status — current window state
router.get('/status', getStatus);

// POST /tatkal/check — gate check for a simulated booking attempt
router.post('/check', checkWindow);

module.exports = router;
