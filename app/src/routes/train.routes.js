const express = require('express');
const { searchTrains, getAvailability } = require('../controllers/train.controller');

const router = express.Router();

// GET /trains/search?source=&destination=&date=
router.get('/search', searchTrains);

// GET /trains/:trainId/availability?date=&class=
router.get('/:trainId/availability', getAvailability);

module.exports = router;
