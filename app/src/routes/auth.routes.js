const express = require('express');
const { signup, login } = require('../controllers/auth.controller');

const router = express.Router();

// POST /auth/signup — Register a new user
router.post('/signup', signup);

// POST /auth/login — Authenticate and receive JWT
router.post('/login', login);

module.exports = router;
