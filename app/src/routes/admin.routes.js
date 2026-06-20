const express = require('express');
const { forceOpen, forceClose, resetOverride } = require('../controllers/admin.controller');

const router = express.Router();

// POST /admin/tatkal/open  — force Tatkal window OPEN (demo only)
router.post('/tatkal/open', forceOpen);

// POST /admin/tatkal/close — force Tatkal window CLOSED (demo only)
router.post('/tatkal/close', forceClose);

// POST /admin/tatkal/reset — clear override, restore time-based logic
router.post('/tatkal/reset', resetOverride);

module.exports = router;
